'use client'

import { useId, useState } from 'react'
import Button from '@/components/ui/Button'
import CloseButton from '@/components/ui/CloseButton'
import MarkdownContent from '@/components/shared/MarkdownContent'
import DiagramBuildSequence from '../diagram/DiagramBuildSequence'
import DiagramKindIcon from '../diagram/DiagramKindIcon'
import DiagramLegend from '../diagram/DiagramLegend'
import DiagramNotes from '../diagram/DiagramNotes'
import DiagramViewTabs from '../diagram/DiagramViewTabs'
import LazyDiagramCanvas from '../diagram/LazyDiagramCanvas'
import { DownloadIcon, ExitFullScreenIcon, FullScreenIcon } from '@/configs/icons.config'
import { diagramFileName, diagramToMarkdown, kindsInView } from '@/utils/diagram'
import { diagramKindLabel, type Diagram, type DiagramNode } from '@/@types/library/Diagram'
import useFullScreen from '@/utils/hooks/useFullScreen'
import classNames from '@/utils/classNames'

interface AssetDiagramProps {
    diagram: Diagram
    /** The asset's title (the brief's heading and file name) */
    title: string
    /** The editor's preview: no navigation links */
    preview?: boolean
}

/**
 * A reference architecture's diagram, read-only: scenario tabs, description, legend, the canvas (pan and
 * zoom; select a component for its build guidance), notes and the build sequence. Printing skips the
 * canvas and prints every view's description, notes and build sequence instead.
 */
export default function AssetDiagram({ diagram, title, preview }: AssetDiagramProps) {
    const panelId = useId()
    const headingId = useId()
    const [activeId, setActiveId] = useState(diagram.views[0]?.id ?? '')
    const [selected, setSelected] = useState<string[]>([])
    const [fullScreen, setFullScreen] = useFullScreen()

    const view = diagram.views.find((v) => v.id === activeId) ?? diagram.views[0]
    if (!view) return null
    const node = selected.length === 1 ? view.nodes.find((n) => n.id === selected[0]) : undefined

    const selectView = (viewId: string) => {
        setActiveId(viewId)
        setSelected([])
    }

    const download = () => {
        const blob = new Blob([diagramToMarkdown(diagram, title)], { type: 'text/markdown;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = diagramFileName(title)
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
    }

    const kinds = kindsInView(view)

    return (
        <section className="mt-8" aria-labelledby={headingId}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 id={headingId} className="text-xl">
                    Architecture diagram
                </h2>
                <div className="no-print flex flex-wrap gap-2">
                    <Button size="xs" icon={<DownloadIcon />} onClick={download}>
                        Download brief
                    </Button>
                    <Button size="xs" icon={<FullScreenIcon />} onClick={() => setFullScreen(true)}>
                        Full screen
                    </Button>
                </div>
            </div>

            <div
                className={classNames(
                    'print:hidden',
                    fullScreen &&
                        'fixed inset-0 z-[35] flex flex-col overflow-y-auto bg-white p-4 sm:p-6 dark:bg-gray-900',
                )}
                role={fullScreen ? 'dialog' : undefined}
                aria-modal={fullScreen || undefined}
                aria-label={fullScreen ? `${title} — architecture diagram (full screen)` : undefined}
            >
                {fullScreen && (
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <h3 className="truncate text-lg">{title}</h3>
                        <Button size="xs" icon={<ExitFullScreenIcon />} onClick={() => setFullScreen(false)}>
                            Exit full screen
                        </Button>
                    </div>
                )}
                <DiagramViewTabs views={diagram.views} activeId={view.id} onSelect={selectView} panelId={panelId} />
                <div
                    id={panelId}
                    role="tabpanel"
                    aria-labelledby={`${panelId}-tab-${view.id}`}
                    className="flex min-h-0 flex-1 flex-col pt-3"
                >
                    {view.description.trim() && (
                        <p className="mb-2 text-gray-700 dark:text-gray-300">{view.description}</p>
                    )}
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <DiagramLegend kinds={kinds} />
                        {view.nodes.length > 0 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                Select any component for build guidance
                            </span>
                        )}
                    </div>
                    {view.nodes.length ? (
                        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
                            <div className={classNames('min-w-0', !node && 'lg:col-span-2')}>
                                <LazyDiagramCanvas
                                    key={`${view.id}-${fullScreen}`}
                                    view={view}
                                    readOnly
                                    selected={selected}
                                    onSelectedChange={setSelected}
                                    className={fullScreen ? 'h-[calc(100vh-15rem)] min-h-[360px]' : 'h-[520px]'}
                                />
                            </div>
                            {node && (
                                <NodeDetails
                                    node={node}
                                    preview={preview}
                                    onClose={() => setSelected([])}
                                    className={fullScreen ? 'max-h-[calc(100vh-15rem)]' : 'max-h-[520px]'}
                                />
                            )}
                        </div>
                    ) : (
                        <p className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
                            This view has no components yet.
                        </p>
                    )}
                    <DiagramNotes notes={view.notes} className="mt-3" />
                    {!fullScreen && <DiagramBuildSequence view={view} internalLinks={!preview} className="mt-6" />}
                </div>
            </div>

            {/* Printed: every view's description, notes and build sequence (the canvas doesn't print) */}
            <div className="hidden space-y-6 print:block">
                {diagram.views.map((v) => (
                    <div key={v.id}>
                        <h3 className="text-lg font-semibold">{v.name}</h3>
                        {v.description.trim() && <p className="mt-1">{v.description}</p>}
                        <DiagramNotes notes={v.notes} className="mt-3" />
                        <DiagramBuildSequence view={v} as="h4" internalLinks={!preview} className="mt-4" />
                    </div>
                ))}
            </div>
        </section>
    )
}

interface NodeDetailsProps {
    node: DiagramNode
    preview?: boolean
    onClose: () => void
    className?: string
}

/** The selected component: kind, build step and build guidance */
function NodeDetails({ node, preview, onClose, className }: NodeDetailsProps) {
    return (
        <aside
            className={classNames(
                'overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800',
                className,
            )}
            aria-label={`${node.label}: build guidance`}
            aria-live="polite"
        >
            <div className="flex items-start gap-3">
                <DiagramKindIcon kind={node.kind} className="h-9 w-9 text-xl" />
                <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                        {diagramKindLabel[node.kind]}
                    </div>
                    <h3 className="text-base leading-snug font-semibold">{node.label}</h3>
                    {node.subtitle.trim() && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{node.subtitle}</p>
                    )}
                </div>
                <CloseButton onClick={onClose} aria-label="Close build guidance" />
            </div>
            <div className={classNames('mt-3 flex items-center gap-2 text-sm', `diagram-kind-${node.kind}`)}>
                {node.step !== null ? (
                    <>
                        <span className="diagram-step" aria-hidden>
                            {node.step}
                        </span>
                        <span className="font-medium text-gray-700 dark:text-gray-200">Build step {node.step}</span>
                    </>
                ) : (
                    <span className="text-gray-500 dark:text-gray-400">Not a build step</span>
                )}
            </div>
            <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-700">
                {node.guidance.trim() ? (
                    <MarkdownContent className="prose-sm" internalLinks={!preview}>
                        {node.guidance}
                    </MarkdownContent>
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No build guidance for this component.</p>
                )}
            </div>
        </aside>
    )
}
