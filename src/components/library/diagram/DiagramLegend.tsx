import classNames from '@/utils/classNames'
import type { DiagramComponent } from '@/@types/library/DiagramComponent'

interface DiagramLegendProps {
    /** The component types to list (kindsInView) */
    components: readonly DiagramComponent[]
    className?: string
}

/** The colour legend of component types (above the canvas) */
export default function DiagramLegend({ components, className }: DiagramLegendProps) {
    if (!components.length) return null
    return (
        <ul
            className={classNames(
                'flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-600 dark:text-gray-300',
                className,
            )}
            aria-label="Legend"
        >
            {components.map((component) => (
                <li
                    key={component.code}
                    className={classNames('inline-flex items-center gap-1.5', `diagram-color-${component.color}`)}
                    title={component.description || undefined}
                >
                    <span className="diagram-swatch" aria-hidden />
                    {component.name}
                </li>
            ))}
        </ul>
    )
}
