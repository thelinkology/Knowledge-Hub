'use client'

import { type DragEvent } from 'react'
import DiagramKindIcon from '../../diagram/DiagramKindIcon'
import { DIAGRAM_KIND_MIME } from '@/utils/diagram'
import {
    DIAGRAM_NODE_KINDS,
    diagramKindDescription,
    diagramKindLabel,
    type DiagramNodeKind,
} from '@/@types/library/Diagram'

interface DiagramPaletteProps {
    /** Adds a component of this kind in the middle of the canvas */
    onAdd: (kind: DiagramNodeKind) => void
}

/**
 * The component palette: drag a kind onto the canvas to drop it there, or press it (mouse or keyboard)
 * to add it in the middle of the canvas.
 */
export default function DiagramPalette({ onAdd }: DiagramPaletteProps) {
    const onDragStart = (e: DragEvent<HTMLButtonElement>, kind: DiagramNodeKind) => {
        e.dataTransfer.setData(DIAGRAM_KIND_MIME, kind)
        e.dataTransfer.effectAllowed = 'copy'
    }

    return (
        <div className="shrink-0 md:w-52" role="group" aria-labelledby="diagram-palette-title">
            <h3
                id="diagram-palette-title"
                className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400"
            >
                Components
            </h3>
            <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:max-h-[480px] md:grid-cols-1 md:overflow-y-auto md:pr-1">
                {DIAGRAM_NODE_KINDS.map((kind) => (
                    <li key={kind}>
                        <button
                            type="button"
                            draggable
                            onDragStart={(e) => onDragStart(e, kind)}
                            onClick={() => onAdd(kind)}
                            title={`${diagramKindDescription[kind]} Drag onto the canvas, or press to add.`}
                            aria-label={`Add ${diagramKindLabel[kind]}`}
                            className="flex w-full cursor-grab items-center gap-2 rounded-xl border border-gray-200 bg-white px-2 py-1.5 text-left text-sm font-medium text-gray-800 transition hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:cursor-grabbing dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:border-primary"
                        >
                            <DiagramKindIcon kind={kind} />
                            <span className="min-w-0 leading-tight">{diagramKindLabel[kind]}</span>
                        </button>
                    </li>
                ))}
            </ul>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Drag onto the canvas, or press to add.</p>
        </div>
    )
}
