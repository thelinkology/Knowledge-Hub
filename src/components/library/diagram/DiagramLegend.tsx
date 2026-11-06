import { diagramKindDescription, diagramKindLabel, type DiagramNodeKind } from '@/@types/library/Diagram'
import classNames from '@/utils/classNames'

interface DiagramLegendProps {
    kinds: readonly DiagramNodeKind[]
    className?: string
}

/** The colour legend of component types (above the canvas) */
export default function DiagramLegend({ kinds, className }: DiagramLegendProps) {
    if (!kinds.length) return null
    return (
        <ul
            className={classNames(
                'flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-600 dark:text-gray-300',
                className,
            )}
            aria-label="Legend"
        >
            {kinds.map((kind) => (
                <li
                    key={kind}
                    className={classNames('inline-flex items-center gap-1.5', `diagram-kind-${kind}`)}
                    title={diagramKindDescription[kind]}
                >
                    <span className="diagram-swatch" aria-hidden />
                    {diagramKindLabel[kind]}
                </li>
            ))}
        </ul>
    )
}
