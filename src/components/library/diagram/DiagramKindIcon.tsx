import { diagramIcon } from '@/configs/icons.config'
import classNames from '@/utils/classNames'
import type { DiagramComponent } from '@/@types/library/DiagramComponent'

interface DiagramKindIconProps {
    component: Pick<DiagramComponent, 'color' | 'icon' | 'imageUrl'>
    className?: string
}

/**
 * A component type's image, or its icon on its colour (decorative: the type is always named in text
 * nearby)
 */
export default function DiagramKindIcon({ component, className }: DiagramKindIconProps) {
    if (component.imageUrl) {
        return (
            <span
                className={classNames(
                    'diagram-kind-icon diagram-kind-icon-image',
                    `diagram-color-${component.color}`,
                    className,
                )}
                aria-hidden
            >
                <img src={component.imageUrl} alt="" draggable={false} />
            </span>
        )
    }
    const Icon = diagramIcon[component.icon]
    return (
        <span className={classNames('diagram-kind-icon', `diagram-color-${component.color}`, className)} aria-hidden>
            <Icon />
        </span>
    )
}
