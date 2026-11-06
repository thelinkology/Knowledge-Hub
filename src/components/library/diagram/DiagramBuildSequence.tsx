import MarkdownContent from '@/components/shared/MarkdownContent'
import { buildSequence } from '@/utils/diagram'
import { diagramKindLabel, type DiagramView } from '@/@types/library/Diagram'
import classNames from '@/utils/classNames'

interface DiagramBuildSequenceProps {
    view: DiagramView
    /** Heading level of "Build sequence" */
    as?: 'h3' | 'h4'
    /** Links to pages in this app open in the same tab (off in the editor's preview) */
    internalLinks?: boolean
    className?: string
}

/** The view's numbered build sequence with each step's guidance (prints cleanly) */
export default function DiagramBuildSequence({
    view,
    as: Heading = 'h3',
    internalLinks = true,
    className,
}: DiagramBuildSequenceProps) {
    const sequence = buildSequence(view)
    if (!sequence.length) return null
    return (
        <section className={className}>
            <Heading className="mb-3 text-base font-semibold">Build sequence</Heading>
            <ol className="space-y-4">
                {sequence.map((node) => (
                    <li key={node.id} className={classNames('flex gap-3', `diagram-kind-${node.kind}`)}>
                        <span className="diagram-step mt-0.5" aria-hidden>
                            {node.step}
                        </span>
                        <div className="min-w-0 flex-1">
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                                <span className="sr-only">Step {node.step}: </span>
                                {node.label}
                                <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-gray-500 dark:text-gray-400">
                                    <span className="diagram-swatch" aria-hidden />
                                    {diagramKindLabel[node.kind]}
                                </span>
                            </div>
                            {node.guidance.trim() && (
                                <MarkdownContent className="prose-sm mt-1" internalLinks={internalLinks}>
                                    {node.guidance}
                                </MarkdownContent>
                            )}
                        </div>
                    </li>
                ))}
            </ol>
        </section>
    )
}
