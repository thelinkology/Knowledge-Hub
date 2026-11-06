'use client'

import { memo } from 'react'
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import DiagramKindIcon from './DiagramKindIcon'
import { diagramKindLabel, type DiagramNode } from '@/@types/library/Diagram'
import classNames from '@/utils/classNames'
import type { DiagramSide } from '@/utils/diagram'

export type DiagramFlowNode = Node<{ item: DiagramNode; readOnly: boolean }, 'component'>

const SIDES: { id: DiagramSide; position: Position }[] = [
    { id: 'top', position: Position.Top },
    { id: 'right', position: Position.Right },
    { id: 'bottom', position: Position.Bottom },
    { id: 'left', position: Position.Left },
]

/**
 * A component on the canvas: coloured accent and icon by kind, its name, a small subtitle (or the kind)
 * and the numbered build-step badge. Connection handles on all four sides (connections pick the sides
 * that face each other, so the handles only start connections).
 */
function DiagramNodeCard({ data, selected }: NodeProps<DiagramFlowNode>) {
    const { item, readOnly } = data
    return (
        <div className={classNames('diagram-node', `diagram-kind-${item.kind}`, selected && 'diagram-node-selected')}>
            <DiagramKindIcon kind={item.kind} />
            <div className="min-w-0 flex-1">
                <div className="diagram-node-label">{item.label}</div>
                <div className="diagram-node-subtitle">{item.subtitle.trim() || diagramKindLabel[item.kind]}</div>
            </div>
            {item.step !== null && (
                <span className="diagram-step" title={`Build step ${item.step}`}>
                    {item.step}
                </span>
            )}
            {SIDES.map((side) => (
                <Handle
                    key={side.id}
                    id={side.id}
                    type="source"
                    position={side.position}
                    isConnectable={!readOnly}
                    aria-label={readOnly ? undefined : `Connect from the ${side.id} of ${item.label}`}
                />
            ))}
        </div>
    )
}

export default memo(DiagramNodeCard)
