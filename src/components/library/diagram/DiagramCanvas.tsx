'use client'

import { useImperativeHandle, useMemo, useRef, useState, type DragEvent, type ReactNode, type Ref } from 'react'
import {
    Background,
    BackgroundVariant,
    ConnectionMode,
    Controls,
    MarkerType,
    getNodesBounds,
    getViewportForBounds,
    ReactFlow,
    ReactFlowProvider,
    useReactFlow,
    useStoreApi,
    type Connection,
    type Dimensions,
    type Edge,
    type EdgeChange,
    type NodeChange,
    type OnConnectEnd,
    type OnDelete,
    type XYPosition,
} from '@xyflow/react'
import { toastError } from '@/components/ui/toast/toast'
import DiagramNodeCard, { type DiagramFlowNode } from './DiagramNodeCard'
import {
    DIAGRAM_GRID,
    DIAGRAM_KIND_MIME,
    DIAGRAM_NODE_SIZE,
    connectNodes,
    createNode,
    edgeSides,
    exportImageSize,
    newDiagramId,
    removeElements,
} from '@/utils/diagram'
import { DIAGRAM_LIMITS, type DiagramView } from '@/@types/library/Diagram'
import useDiagramComponents from '@/utils/hooks/useDiagramComponents'
import classNames from '@/utils/classNames'
import type { DiagramComponent } from '@/@types/library/DiagramComponent'

const NODE_TYPES = { component: DiagramNodeCard }
const SNAP_GRID: [number, number] = [DIAGRAM_GRID, DIAGRAM_GRID]
const FIT_VIEW_OPTIONS = { padding: 0.15, maxZoom: 1 }
const MARKER_END = { type: MarkerType.ArrowClosed, width: 18, height: 18 }
const DELETE_KEYS = ['Delete', 'Backspace']

/** Shown in an exported image instead of an image that can't be loaded (e.g. a link to another site) */
const TRANSPARENT_PIXEL =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

/** An exported picture of the view */
export interface DiagramImage {
    dataUrl: string
    /** Size in CSS pixels (the image itself has twice as many, for sharp printing) */
    width: number
    height: number
}

/** What the page can ask of the canvas (see exportRef) */
export interface DiagramCanvasExporter {
    /** The whole view (not just what's visible) as a PNG or JPEG on white, in the light theme */
    toImage: (format: 'png' | 'jpeg') => Promise<DiagramImage>
}

export type SelectionUpdate = (previous: string[]) => string[]
export type ViewUpdate = (view: DiagramView) => DiagramView

export interface DiagramCanvasProps {
    view: DiagramView
    /** Reading: pan and zoom, select components; nothing moves or connects */
    readOnly?: boolean
    /** Ids of the selected components and connections */
    selected: string[]
    onSelectedChange: (update: SelectionUpdate) => void
    /** Editing: applies a change to the view */
    onViewChange?: (update: ViewUpdate) => void
    /** Editing: the palette beside the canvas; `add` puts a component in the middle of what's visible */
    renderPalette?: (add: (component: DiagramComponent) => void) => ReactNode
    /** Height of the canvas (Tailwind classes); ignored with `fill` */
    className?: string
    /** Fill the parent's height (full screen) instead of a fixed height */
    fill?: boolean
    /** Receives the image exporter (Download as PNG / JPG / PDF) */
    exportRef?: Ref<DiagramCanvasExporter>
}

/** The React Flow canvas for one view. Render it on the client only (see LazyDiagramCanvas). */
export default function DiagramCanvas(props: DiagramCanvasProps) {
    return (
        <ReactFlowProvider>
            <Canvas {...props} />
        </ReactFlowProvider>
    )
}

function Canvas({
    view,
    readOnly,
    selected,
    onSelectedChange,
    onViewChange,
    renderPalette,
    className,
    fill,
    exportRef,
}: DiagramCanvasProps) {
    const { screenToFlowPosition, getNodes } = useReactFlow<DiagramFlowNode>()
    const { resolve } = useDiagramComponents()
    const canvas = useRef<HTMLDivElement>(null)
    const store = useStoreApi<DiagramFlowNode>()
    // Sizes React Flow measured (kept here because the nodes are rebuilt from the view on every change)
    const [measured, setMeasured] = useState<Record<string, Dimensions>>({})
    // Positions while a drag is in progress; written to the view when the drag ends
    const [dragging, setDragging] = useState<Record<string, XYPosition>>({})
    const editable = !readOnly && !!onViewChange

    const selectedIds = useMemo(() => new Set(selected), [selected])

    const nodes = useMemo<DiagramFlowNode[]>(
        () =>
            view.nodes.map((item) => {
                const component = resolve(item.kind)
                return {
                    id: item.id,
                    type: 'component' as const,
                    position: dragging[item.id] ?? { x: item.x, y: item.y },
                    data: { item, component, readOnly: !editable },
                    selected: selectedIds.has(item.id),
                    measured: measured[item.id],
                    draggable: editable,
                    connectable: editable,
                    deletable: editable,
                    ariaLabel: `${item.label}, ${component.name}${item.step !== null ? `, build step ${item.step}` : ''}`,
                }
            }),
        [view.nodes, dragging, editable, selectedIds, measured, resolve],
    )

    const edges = useMemo<Edge[]>(() => {
        const boxes = new Map(
            nodes.map((node) => [
                node.id,
                { ...node.position, width: node.measured?.width, height: node.measured?.height },
            ]),
        )
        return view.edges.map((edge) => {
            const source = boxes.get(edge.source)
            const target = boxes.get(edge.target)
            const sides = source && target ? edgeSides(source, target) : { sourceSide: 'right', targetSide: 'left' }
            return {
                id: edge.id,
                source: edge.source,
                target: edge.target,
                sourceHandle: sides.sourceSide,
                targetHandle: sides.targetSide,
                type: 'smoothstep',
                label: edge.label.trim() || undefined,
                labelBgPadding: [6, 3] as [number, number],
                labelBgBorderRadius: 6,
                markerEnd: MARKER_END,
                selected: selectedIds.has(edge.id),
                deletable: editable,
                focusable: editable,
                selectable: editable,
            }
        })
    }, [nodes, view.edges, selectedIds, editable])

    const applySelection = (changes: { id: string; selected: boolean }[]) => {
        if (!changes.length) return
        onSelectedChange((previous) => {
            const next = new Set(previous)
            for (const change of changes) {
                if (change.selected) next.add(change.id)
                else next.delete(change.id)
            }
            return [...next]
        })
    }

    const onNodesChange = (changes: NodeChange<DiagramFlowNode>[]) => {
        const sizes: Record<string, Dimensions> = {}
        const moving: Record<string, XYPosition> = {}
        const moved: Record<string, XYPosition> = {}
        const selection: { id: string; selected: boolean }[] = []
        for (const change of changes) {
            if (change.type === 'dimensions' && change.dimensions) sizes[change.id] = change.dimensions
            else if (change.type === 'position' && change.position) {
                if (change.dragging) moving[change.id] = change.position
                else moved[change.id] = change.position
            } else if (change.type === 'select') selection.push(change)
        }
        if (Object.keys(sizes).length) setMeasured((previous) => ({ ...previous, ...sizes }))
        if (Object.keys(moving).length) setDragging((previous) => ({ ...previous, ...moving }))
        const movedIds = Object.keys(moved)
        if (movedIds.length && editable) {
            setDragging((previous) => {
                const next = { ...previous }
                for (const id of movedIds) delete next[id]
                return next
            })
            onViewChange?.((current) => {
                const changed = current.nodes.some(
                    (node) => moved[node.id] && (moved[node.id].x !== node.x || moved[node.id].y !== node.y),
                )
                if (!changed) return current
                return {
                    ...current,
                    nodes: current.nodes.map((node) =>
                        moved[node.id]
                            ? { ...node, x: Math.round(moved[node.id].x), y: Math.round(moved[node.id].y) }
                            : node,
                    ),
                }
            })
        }
        applySelection(selection)
    }

    const onEdgesChange = (changes: EdgeChange[]) => {
        if (!editable) return
        applySelection(changes.filter((change) => change.type === 'select'))
    }

    /** Connects two components and selects the new connection, so its label can be typed straight away */
    const connect = (source: string, target: string) => {
        if (!editable) return
        const id = newDiagramId('e')
        if (!connectNodes(view, source, target, '', id)) {
            if (view.edges.length >= DIAGRAM_LIMITS.edges) {
                toastError('A view holds up to 300 connections. Start another view for the rest.')
            }
            return
        }
        onViewChange?.((current) => connectNodes(current, source, target, '', id) ?? current)
        onSelectedChange(() => [id])
    }

    const onConnect = (connection: Connection) => connect(connection.source, connection.target)

    /** Released on a component rather than exactly on one of its handles: connect to that component */
    const onConnectEnd: OnConnectEnd = (event, state) => {
        if (!editable || state.isValid || !state.fromNode) return
        const point = 'changedTouches' in event ? event.changedTouches[0] : event
        if (!point) return
        const element = document.elementFromPoint(point.clientX, point.clientY)
        const targetId = element?.closest('.react-flow__node')?.getAttribute('data-id')
        if (targetId && targetId !== state.fromNode.id) connect(state.fromNode.id, targetId)
    }

    const onDelete: OnDelete = ({ nodes: removedNodes, edges: removedEdges }) => {
        if (!editable) return
        const removed = new Set([...removedNodes.map((n) => n.id), ...removedEdges.map((e) => e.id)])
        onViewChange?.((current) =>
            removeElements(
                current,
                removedNodes.map((n) => n.id),
                removedEdges.map((e) => e.id),
            ),
        )
        onSelectedChange((previous) => previous.filter((id) => !removed.has(id)))
    }

    /** Adds a component with its top-left near `point` (a flow position), then selects it */
    const addAt = (component: DiagramComponent, point: XYPosition) => {
        if (!editable) return
        if (view.nodes.length >= DIAGRAM_LIMITS.nodes) {
            toastError('A view holds up to 150 components. Start another view for the rest.')
            return
        }
        const node = createNode(view, component, {
            x: point.x - DIAGRAM_NODE_SIZE.width / 2,
            y: point.y - DIAGRAM_NODE_SIZE.height / 2,
        })
        onViewChange?.((current) => ({ ...current, nodes: [...current.nodes, node] }))
        onSelectedChange(() => [node.id])
    }

    /** Adds a component in the middle of what the canvas shows (palette click or keyboard) */
    const addInCentre = (component: DiagramComponent) => {
        const { width, height, transform } = store.getState()
        const [x, y, zoom] = transform
        addAt(component, { x: (width / 2 - x) / zoom, y: (height / 2 - y) / zoom })
    }

    const onDragOver = (e: DragEvent<HTMLDivElement>) => {
        if (!editable || !e.dataTransfer.types.includes(DIAGRAM_KIND_MIME)) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
    }

    const onDrop = (e: DragEvent<HTMLDivElement>) => {
        const component = resolve(e.dataTransfer.getData(DIAGRAM_KIND_MIME))
        if (!editable || !component.id) return
        e.preventDefault()
        addAt(component, screenToFlowPosition({ x: e.clientX, y: e.clientY }))
    }

    useImperativeHandle(
        exportRef,
        () => ({
            toImage: async (format) => {
                const element = canvas.current
                const viewport = element?.querySelector<HTMLElement>('.react-flow__viewport')
                const flowNodes = getNodes()
                if (!element || !viewport || !flowNodes.length) throw new Error('There is nothing to export yet.')
                const bounds = getNodesBounds(flowNodes)
                const size = exportImageSize(bounds)
                // Zoom 1, the diagram centred in the padding exportImageSize added around it
                const { x, y, zoom } = getViewportForBounds(bounds, size.width, size.height, 0.1, 1, 0)
                const { toJpeg, toPng } = await import('html-to-image')
                const options = {
                    backgroundColor: '#ffffff',
                    width: size.width,
                    height: size.height,
                    pixelRatio: 2,
                    imagePlaceholder: TRANSPARENT_PIXEL,
                    style: {
                        width: `${size.width}px`,
                        height: `${size.height}px`,
                        transform: `translate(${x}px, ${y}px) scale(${zoom})`,
                    },
                    filter: (node: HTMLElement) => !node.classList?.contains('react-flow__handle'),
                }
                // Light colours while the picture is taken (html-to-image reads the computed styles)
                element.classList.add('diagram-exporting')
                try {
                    const dataUrl =
                        format === 'png'
                            ? await toPng(viewport, options)
                            : await toJpeg(viewport, { ...options, quality: 0.95 })
                    return { dataUrl, width: size.width, height: size.height }
                } finally {
                    element.classList.remove('diagram-exporting')
                }
            },
        }),
        [getNodes],
    )

    return (
        <div className={classNames('flex min-h-0 flex-col gap-3 md:flex-row', fill && 'h-full')}>
            {editable && renderPalette?.(addInCentre)}
            <div
                ref={canvas}
                className={classNames(
                    'diagram-canvas min-w-0 flex-1',
                    !editable && 'diagram-readonly',
                    fill ? 'min-h-[320px] md:h-full' : (className ?? 'h-[520px]'),
                )}
                onDragOver={onDragOver}
                onDrop={onDrop}
            >
                <ReactFlow<DiagramFlowNode, Edge>
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={NODE_TYPES}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onConnectEnd={onConnectEnd}
                    onDelete={onDelete}
                    connectionMode={ConnectionMode.Loose}
                    nodesDraggable={editable}
                    nodesConnectable={editable}
                    elementsSelectable
                    edgesFocusable={editable}
                    deleteKeyCode={editable ? DELETE_KEYS : null}
                    snapToGrid
                    snapGrid={SNAP_GRID}
                    fitView
                    fitViewOptions={FIT_VIEW_OPTIONS}
                    minZoom={0.2}
                    maxZoom={2}
                    zoomOnScroll={editable}
                    preventScrolling={editable}
                    defaultMarkerColor={null}
                    aria-label={editable ? `Diagram canvas: ${view.name}` : `Architecture diagram: ${view.name}`}
                >
                    <Background variant={BackgroundVariant.Dots} gap={DIAGRAM_GRID} size={1.2} />
                    <Controls showInteractive={false} position="bottom-left" />
                </ReactFlow>
            </div>
        </div>
    )
}
