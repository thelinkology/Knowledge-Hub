'use client'

import { useId, useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Segment from '@/components/ui/Segment'
import Select from '@/components/ui/Select'
import { FormItem } from '@/components/ui/Form'
import MarkdownContent from '@/components/shared/MarkdownContent'
import DiagramKindIcon from '../../diagram/DiagramKindIcon'
import { DeleteIcon, ForwardIcon, RefreshIcon } from '@/configs/icons.config'
import { nextStep, removeElements } from '@/utils/diagram'
import {
    DIAGRAM_LIMITS,
    DIAGRAM_NODE_KINDS,
    diagramKindLabel,
    type DiagramEdge,
    type DiagramNode,
    type DiagramView,
} from '@/@types/library/Diagram'
import type { SelectionUpdate, ViewUpdate } from '../../diagram/DiagramCanvas'

const KIND_OPTIONS = DIAGRAM_NODE_KINDS.map((kind) => ({ value: kind, label: diagramKindLabel[kind] }))

/** Labels people use on connections (offered as suggestions) */
const EDGE_LABEL_SUGGESTIONS = [
    'Fabric pipeline',
    'Azure Data Factory',
    'Power Automate',
    'loads',
    'reads',
    'writes',
    'writes back',
    'triggers',
    'approves',
    'refreshes',
]

interface DiagramInspectorProps {
    view: DiagramView
    selected: string[]
    onViewChange: (update: ViewUpdate) => void
    onSelectedChange: (update: SelectionUpdate) => void
}

/** The right-hand panel: edits the selected component or connection (or explains how to start) */
export default function DiagramInspector({ view, selected, onViewChange, onSelectedChange }: DiagramInspectorProps) {
    const node = selected.length === 1 ? view.nodes.find((n) => n.id === selected[0]) : undefined
    const edge = selected.length === 1 && !node ? view.edges.find((e) => e.id === selected[0]) : undefined

    const remove = () => {
        onViewChange((current) => removeElements(current, selected, selected))
        onSelectedChange(() => [])
    }

    return (
        <aside
            className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
            aria-label="Inspector"
        >
            {node ? (
                <NodeInspector key={node.id} node={node} view={view} onViewChange={onViewChange} onRemove={remove} />
            ) : edge ? (
                <EdgeInspector key={edge.id} edge={edge} view={view} onViewChange={onViewChange} onRemove={remove} />
            ) : selected.length > 1 ? (
                <div className="space-y-3">
                    <h3 className="text-base font-semibold">{selected.length} items selected</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Drag any of them to move them together, or delete them all. Deleting a component also deletes
                        its connections.
                    </p>
                    <Button size="sm" icon={<DeleteIcon />} onClick={remove} className="text-error">
                        Delete selected
                    </Button>
                </div>
            ) : (
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Build guidance</h3>
                    <p>Select a component or connection to edit it.</p>
                    <ul className="list-disc space-y-1.5 pl-5">
                        <li>Drag a component from the palette onto the canvas, or press it to add it.</li>
                        <li>
                            Connect two components by dragging from a dot on the edge of one onto the other. Select the
                            connection to label it (e.g. “Fabric pipeline”).
                        </li>
                        <li>Give the components to build a step number: they show as numbered badges.</li>
                        <li>
                            <kbd>Delete</kbd> or <kbd>Backspace</kbd> removes the selection; <kbd>Shift</kbd> + drag
                            selects several; arrow keys move a selected component.
                        </li>
                    </ul>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {view.nodes.length} of {DIAGRAM_LIMITS.nodes} components · {view.edges.length} connections
                    </p>
                </div>
            )}
        </aside>
    )
}

interface NodeInspectorProps {
    node: DiagramNode
    view: DiagramView
    onViewChange: (update: ViewUpdate) => void
    onRemove: () => void
}

function NodeInspector({ node, view, onViewChange, onRemove }: NodeInspectorProps) {
    const id = useId()
    const [guidanceMode, setGuidanceMode] = useState<'write' | 'preview'>('write')

    const patch = (changes: Partial<DiagramNode>) =>
        onViewChange((current) => ({
            ...current,
            nodes: current.nodes.map((n) => (n.id === node.id ? { ...n, ...changes } : n)),
        }))

    const setStep = (text: string) => {
        const value = Number.parseInt(text, 10)
        patch({ step: Number.isFinite(value) ? Math.min(DIAGRAM_LIMITS.maxStep, Math.max(1, value)) : null })
    }

    const labelMissing = !node.label.trim()

    return (
        <div>
            <div className="mb-4 flex items-center gap-2">
                <DiagramKindIcon kind={node.kind} />
                <h3 className="min-w-0 truncate text-base font-semibold">{node.label.trim() || 'Component'}</h3>
            </div>
            <FormItem
                label="Name"
                htmlFor={`${id}-label`}
                asterisk
                invalid={labelMissing}
                errorMessage={labelMissing ? 'Give the component a name' : undefined}
                className="mb-4"
            >
                <Input
                    id={`${id}-label`}
                    size="sm"
                    value={node.label}
                    maxLength={DIAGRAM_LIMITS.nodeLabel}
                    invalid={labelMissing}
                    onChange={(e) => patch({ label: e.target.value })}
                />
            </FormItem>
            <FormItem label="Subtitle" htmlFor={`${id}-subtitle`} className="mb-4">
                <Input
                    id={`${id}-subtitle`}
                    size="sm"
                    value={node.subtitle}
                    maxLength={DIAGRAM_LIMITS.nodeSubtitle}
                    placeholder={diagramKindLabel[node.kind]}
                    onChange={(e) => patch({ subtitle: e.target.value })}
                />
            </FormItem>
            <FormItem label="Type" htmlFor={`${id}-kind`} className="mb-4">
                <Select
                    inputId={`${id}-kind`}
                    size="sm"
                    options={KIND_OPTIONS}
                    value={KIND_OPTIONS.find((o) => o.value === node.kind)}
                    onChange={(option) => option && patch({ kind: option.value })}
                    isSearchable={false}
                />
            </FormItem>
            <FormItem label="Build step" htmlFor={`${id}-step`} className="mb-4">
                <div className="flex items-center gap-2">
                    <Input
                        id={`${id}-step`}
                        size="sm"
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={DIAGRAM_LIMITS.maxStep}
                        className="w-24"
                        placeholder="None"
                        value={node.step ?? ''}
                        onChange={(e) => setStep(e.target.value)}
                        aria-describedby={`${id}-step-help`}
                    />
                    {node.step === null ? (
                        <Button size="xs" onClick={() => patch({ step: nextStep(view) })}>
                            Use step {nextStep(view)}
                        </Button>
                    ) : (
                        <Button size="xs" variant="plain" onClick={() => patch({ step: null })}>
                            Clear
                        </Button>
                    )}
                </div>
                <p id={`${id}-step-help`} className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    The order to build in. Components can share a step.
                </p>
            </FormItem>
            <div className="mb-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                    <label htmlFor={`${id}-guidance`} className="form-label mb-0">
                        Build guidance
                    </label>
                    <Segment
                        size="xs"
                        value={guidanceMode}
                        onChange={(value) => setGuidanceMode(value === 'preview' ? 'preview' : 'write')}
                    >
                        <Segment.Item value="write">Write</Segment.Item>
                        <Segment.Item value="preview">Preview</Segment.Item>
                    </Segment>
                </div>
                {guidanceMode === 'write' ? (
                    <Input
                        id={`${id}-guidance`}
                        textArea
                        rows={8}
                        maxLength={DIAGRAM_LIMITS.guidance}
                        value={node.guidance}
                        placeholder="How to build it: steps, settings, gotchas. Markdown works (lists, **bold**, links)."
                        onChange={(e) => patch({ guidance: e.target.value })}
                        className="text-sm"
                    />
                ) : (
                    <div className="max-h-72 min-h-24 overflow-y-auto rounded-xl border border-gray-200 p-3 dark:border-gray-700">
                        {node.guidance.trim() ? (
                            <MarkdownContent className="prose-sm" internalLinks={false}>
                                {node.guidance}
                            </MarkdownContent>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">Nothing written yet.</p>
                        )}
                    </div>
                )}
                <p className="mt-1 text-right text-xs text-gray-500 dark:text-gray-400">
                    {node.guidance.length.toLocaleString()} / {DIAGRAM_LIMITS.guidance.toLocaleString()}
                </p>
            </div>
            <Button size="sm" variant="plain" icon={<DeleteIcon />} onClick={onRemove} className="text-error">
                Delete component
            </Button>
        </div>
    )
}

interface EdgeInspectorProps {
    edge: DiagramEdge
    view: DiagramView
    onViewChange: (update: ViewUpdate) => void
    onRemove: () => void
}

function EdgeInspector({ edge, view, onViewChange, onRemove }: EdgeInspectorProps) {
    const id = useId()
    const name = (nodeId: string) => view.nodes.find((n) => n.id === nodeId)?.label.trim() || 'Component'

    const patch = (changes: Partial<DiagramEdge>) =>
        onViewChange((current) => ({
            ...current,
            edges: current.edges.map((e) => (e.id === edge.id ? { ...e, ...changes } : e)),
        }))

    const reversed = view.edges.some((e) => e.source === edge.target && e.target === edge.source)

    return (
        <div>
            <h3 className="mb-1 text-base font-semibold">Connection</h3>
            <p className="mb-4 flex flex-wrap items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">{name(edge.source)}</span>
                <ForwardIcon aria-label="to" role="img" />
                <span className="font-medium">{name(edge.target)}</span>
            </p>
            <FormItem label="Label" htmlFor={`${id}-label`} className="mb-4">
                <Input
                    id={`${id}-label`}
                    size="sm"
                    autoFocus
                    list={`${id}-suggestions`}
                    value={edge.label}
                    maxLength={DIAGRAM_LIMITS.edgeLabel}
                    placeholder="e.g. Fabric pipeline, triggers"
                    onChange={(e) => patch({ label: e.target.value })}
                />
                <datalist id={`${id}-suggestions`}>
                    {EDGE_LABEL_SUGGESTIONS.map((suggestion) => (
                        <option key={suggestion} value={suggestion} />
                    ))}
                </datalist>
            </FormItem>
            <div className="flex flex-wrap gap-2">
                <Button
                    size="sm"
                    icon={<RefreshIcon />}
                    disabled={reversed}
                    title={reversed ? 'There is already a connection the other way' : undefined}
                    onClick={() => patch({ source: edge.target, target: edge.source })}
                >
                    Reverse direction
                </Button>
                <Button size="sm" variant="plain" icon={<DeleteIcon />} onClick={onRemove} className="text-error">
                    Delete connection
                </Button>
            </div>
        </div>
    )
}
