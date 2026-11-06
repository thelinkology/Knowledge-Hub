import { diagramIcon } from '@/configs/icons.config'
import { diagramKindIcon, type DiagramNodeKind } from '@/@types/library/Diagram'
import classNames from '@/utils/classNames'

interface DiagramKindIconProps {
    kind: DiagramNodeKind
    className?: string
}

/** A component kind's icon on its legend colour (decorative: the kind is always named in text nearby) */
export default function DiagramKindIcon({ kind, className }: DiagramKindIconProps) {
    const Icon = diagramIcon[diagramKindIcon[kind]]
    return (
        <span className={classNames('diagram-kind-icon', `diagram-kind-${kind}`, className)} aria-hidden>
            <Icon />
        </span>
    )
}
