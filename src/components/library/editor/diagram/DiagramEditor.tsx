'use client'

import { useId, useMemo, useState } from 'react'
import { useController, useFormContext } from 'react-hook-form'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import Dropdown from '@/components/ui/Dropdown'
import Input from '@/components/ui/Input'
import { FormItem } from '@/components/ui/Form'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import EmptyState from '@/components/shared/EmptyState'
import DiagramLegend from '../../diagram/DiagramLegend'
import DiagramViewTabs from '../../diagram/DiagramViewTabs'
import LazyDiagramCanvas from '../../diagram/LazyDiagramCanvas'
import DiagramPalette from './DiagramPalette'
import DiagramInspector from './DiagramInspector'
import DiagramNotesEditor from './DiagramNotesEditor'
import navigationIcon, {
    AddIcon,
    CopyIcon,
    DeleteIcon,
    DiagramIcon,
    ExitFullScreenIcon,
    ExpandIcon,
    FullScreenIcon,
    MoveLeftIcon,
    NumberedListIcon,
    MoveRightIcon,
} from '@/configs/icons.config'
import {
    buildSequence,
    createView,
    duplicateView,
    glPlanningStarterView,
    kindsInView,
    moveItem,
    renumberSteps,
} from '@/utils/diagram'
import { DIAGRAM_LIMITS, DiagramSchema, type Diagram, type DiagramView } from '@/@types/library/Diagram'
import useFullScreen from '@/utils/hooks/useFullScreen'
import classNames from '@/utils/classNames'
import type { AssetFormData } from '@/@types/library/forms/AssetFormData'
import type { SelectionUpdate, ViewUpdate } from '../../diagram/DiagramCanvas'

/** Readable problems in the diagram ("GL planning only › component 3: Give the component a name") */
function diagramIssues(diagram: Diagram): string[] {
    const parsed = DiagramSchema.safeParse(diagram)
    if (parsed.success) return []
    return parsed.error.issues.slice(0, 5).map((issue) => {
        const [, viewIndex, collection, itemIndex] = issue.path
        const view = typeof viewIndex === 'number' ? diagram.views[viewIndex] : undefined
        if (!view) return issue.message
        const where =
            collection === 'nodes' && typeof itemIndex === 'number'
                ? `component ${itemIndex + 1}${view.nodes[itemIndex]?.label.trim() ? ` (${view.nodes[itemIndex].label})` : ''}`
                : collection === 'notes' && typeof itemIndex === 'number'
                  ? `note ${itemIndex + 1}`
                  : collection === 'edges' && typeof itemIndex === 'number'
                    ? `connection ${itemIndex + 1}`
                    : null
        return `${view.name.trim() || 'Untitled view'}${where ? ` › ${where}` : ''}: ${issue.message}`
    })
}

/**
 * The architecture diagram designer, part of the asset editor's form (field `diagram`): scenario views,
 * a palette of component kinds, the canvas, an inspector for the selection and the view's notes. Every
 * change goes into the form, so Save, Ctrl+S, the unsaved-changes guard and the dirty state just work.
 */
export default function DiagramEditor() {
    const panelId = useId()
    const fieldId = useId()
    const { control, getValues } = useFormContext<AssetFormData>()
    const { field } = useController({ control, name: 'diagram' })
    const diagram: Diagram = field.value
    const [activeId, setActiveId] = useState(diagram.views[0]?.id ?? '')
    const [selected, setSelected] = useState<string[]>([])
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [fullScreen, setFullScreen] = useFullScreen(!confirmDelete)
    const issues = useMemo(() => diagramIssues(diagram), [diagram])

    const view = diagram.views.find((v) => v.id === activeId) ?? diagram.views[0]
    const viewIndex = view ? diagram.views.indexOf(view) : -1

    /** Writes the diagram (always from the form's latest value, so several updates in one event compose) */
    const updateDiagram = (update: (current: Diagram) => Diagram) => field.onChange(update(getValues('diagram')))

    const updateView = (viewId: string, update: ViewUpdate) =>
        updateDiagram((current) => ({
            ...current,
            views: current.views.map((v) => (v.id === viewId ? update(v) : v)),
        }))

    const selectView = (viewId: string) => {
        setActiveId(viewId)
        setSelected([])
    }

    const addView = (next: DiagramView) => {
        if (diagram.views.length >= DIAGRAM_LIMITS.views) return
        updateDiagram((current) => ({ ...current, views: [...current.views, next] }))
        selectView(next.id)
    }

    const duplicate = () => {
        if (!view) return
        const copy = duplicateView(view)
        updateDiagram((current) => {
            const views = [...current.views]
            views.splice(views.findIndex((v) => v.id === view.id) + 1, 0, copy)
            return { ...current, views }
        })
        selectView(copy.id)
    }

    const move = (delta: -1 | 1) => {
        if (!view) return
        updateDiagram((current) => ({
            ...current,
            views: moveItem(
                current.views,
                current.views.findIndex((v) => v.id === view.id),
                delta,
            ),
        }))
    }

    const deleteView = () => {
        if (!view) return
        const neighbour = diagram.views[viewIndex + 1] ?? diagram.views[viewIndex - 1]
        updateDiagram((current) => ({ ...current, views: current.views.filter((v) => v.id !== view.id) }))
        selectView(neighbour?.id ?? '')
        setConfirmDelete(false)
    }

    const onSelectedChange = (update: SelectionUpdate) => setSelected(update)

    const atViewLimit = diagram.views.length >= DIAGRAM_LIMITS.views

    if (!view) {
        return (
            <EmptyState
                icon={<DiagramIcon />}
                title="No architecture diagram yet"
                description={
                    <>
                        Draw how the solution fits together: source systems, databases, cubes, procedures and reports,
                        with labelled connections and a numbered build sequence. Start from the GL planning template and
                        adapt it, or start blank.
                    </>
                }
                action={
                    <div className="flex flex-wrap justify-center gap-2">
                        <Button
                            variant="solid"
                            icon={navigationIcon.template}
                            onClick={() => addView(glPlanningStarterView())}
                        >
                            Start from template
                        </Button>
                        <Button icon={<AddIcon />} onClick={() => addView(createView([], 'Main view'))}>
                            Start blank
                        </Button>
                    </div>
                }
            />
        )
    }

    const hasSteps = buildSequence(view).length > 0

    return (
        <div
            className={classNames(
                fullScreen && 'fixed inset-0 z-[35] flex flex-col overflow-y-auto bg-white p-4 sm:p-6 dark:bg-gray-900',
            )}
            role={fullScreen ? 'region' : undefined}
            aria-label={fullScreen ? 'Architecture diagram (full screen)' : undefined}
        >
            {fullScreen && <h4 className="mb-3">Architecture diagram</h4>}

            <DiagramViewTabs
                views={diagram.views}
                activeId={view.id}
                onSelect={selectView}
                panelId={panelId}
                actions={
                    <Dropdown
                        placement="bottom-end"
                        renderTitle={
                            <Button
                                size="xs"
                                icon={<ExpandIcon />}
                                iconAlignment="end"
                                disabled={atViewLimit}
                                title={atViewLimit ? 'A diagram holds up to 12 views' : undefined}
                            >
                                Add view
                            </Button>
                        }
                        disabled={atViewLimit}
                    >
                        <Dropdown.Item eventKey="blank" onClick={() => addView(createView(diagram.views))}>
                            Blank view
                        </Dropdown.Item>
                        <Dropdown.Item eventKey="template" onClick={() => addView(glPlanningStarterView())}>
                            GL planning template
                        </Dropdown.Item>
                    </Dropdown>
                }
            />

            <div
                id={panelId}
                role="tabpanel"
                aria-labelledby={`${panelId}-tab-${view.id}`}
                className="flex min-h-0 flex-1 flex-col pt-4"
            >
                <div className="grid gap-x-4 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)_auto] md:items-end">
                    <FormItem
                        label="View name"
                        htmlFor={`${fieldId}-name`}
                        invalid={!view.name.trim()}
                        errorMessage={!view.name.trim() ? 'Give the view a name' : undefined}
                        className="mb-3"
                    >
                        <Input
                            id={`${fieldId}-name`}
                            size="sm"
                            value={view.name}
                            maxLength={DIAGRAM_LIMITS.viewName}
                            invalid={!view.name.trim()}
                            placeholder="e.g. GL planning only"
                            onChange={(e) => updateView(view.id, (v) => ({ ...v, name: e.target.value }))}
                        />
                    </FormItem>
                    <FormItem label="Description" htmlFor={`${fieldId}-description`} className="mb-3">
                        <Input
                            id={`${fieldId}-description`}
                            size="sm"
                            value={view.description}
                            maxLength={DIAGRAM_LIMITS.viewDescription}
                            placeholder="One line on when this scenario applies"
                            onChange={(e) => updateView(view.id, (v) => ({ ...v, description: e.target.value }))}
                        />
                    </FormItem>
                    <div className="mb-3 flex flex-wrap gap-1">
                        <Button
                            size="sm"
                            variant="plain"
                            icon={<MoveLeftIcon />}
                            aria-label="Move view left"
                            title="Move view left"
                            disabled={viewIndex <= 0}
                            onClick={() => move(-1)}
                        />
                        <Button
                            size="sm"
                            variant="plain"
                            icon={<MoveRightIcon />}
                            aria-label="Move view right"
                            title="Move view right"
                            disabled={viewIndex >= diagram.views.length - 1}
                            onClick={() => move(1)}
                        />
                        <Button
                            size="sm"
                            variant="plain"
                            icon={<CopyIcon />}
                            aria-label="Duplicate view"
                            title="Duplicate view"
                            disabled={atViewLimit}
                            onClick={duplicate}
                        />
                        <Button
                            size="sm"
                            variant="plain"
                            icon={<DeleteIcon />}
                            aria-label="Delete view"
                            title="Delete view"
                            onClick={() => setConfirmDelete(true)}
                        />
                    </div>
                </div>

                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <DiagramLegend kinds={kindsInView(view)} />
                    <div className="ml-auto flex flex-wrap gap-2">
                        {hasSteps && (
                            <Button
                                size="xs"
                                icon={<NumberedListIcon />}
                                onClick={() => updateView(view.id, renumberSteps)}
                                title="Number the build steps 1, 2, 3… without gaps"
                            >
                                Renumber steps
                            </Button>
                        )}
                        <Button
                            size="xs"
                            icon={fullScreen ? <ExitFullScreenIcon /> : <FullScreenIcon />}
                            onClick={() => setFullScreen(!fullScreen)}
                        >
                            {fullScreen ? 'Exit full screen' : 'Full screen'}
                        </Button>
                    </div>
                </div>

                <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
                    <LazyDiagramCanvas
                        key={`${view.id}-${fullScreen}`}
                        view={view}
                        selected={selected}
                        onSelectedChange={onSelectedChange}
                        onViewChange={(update) => updateView(view.id, update)}
                        renderPalette={(add) => <DiagramPalette onAdd={add} />}
                        className={fullScreen ? 'h-[calc(100vh-17rem)] min-h-[420px]' : 'h-[520px]'}
                    />
                    <DiagramInspector
                        view={view}
                        selected={selected}
                        onViewChange={(update) => updateView(view.id, update)}
                        onSelectedChange={onSelectedChange}
                    />
                </div>

                {issues.length > 0 && (
                    <Alert type="danger" showIcon className="mt-4">
                        <div className="font-semibold">The diagram can’t be saved yet:</div>
                        <ul className="mt-1 list-disc pl-5 text-sm">
                            {issues.map((issue) => (
                                <li key={issue}>{issue}</li>
                            ))}
                        </ul>
                    </Alert>
                )}

                <div className="mt-4">
                    <DiagramNotesEditor view={view} onViewChange={(update) => updateView(view.id, update)} />
                </div>
            </div>

            <ConfirmDialog
                isOpen={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                type="danger"
                title={`Delete the view “${view.name.trim() || 'Untitled view'}”?`}
                confirmText="Delete view"
                onConfirm={deleteView}
            >
                Its {view.nodes.length} components, {view.edges.length} connections and {view.notes.length} notes go
                with it. Until you save, leaving without saving brings it back; after saving it can’t be undone.
            </ConfirmDialog>
        </div>
    )
}
