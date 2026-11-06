'use client'

import { useId, type DragEvent } from 'react'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import DiagramKindIcon from '../../diagram/DiagramKindIcon'
import { SettingsIcon } from '@/configs/icons.config'
import { DIAGRAM_KIND_MIME } from '@/utils/diagram'
import useDiagramComponents from '@/utils/hooks/useDiagramComponents'
import type { DiagramComponent } from '@/@types/library/DiagramComponent'

interface DiagramPaletteProps {
    /** Adds a component of this type in the middle of the canvas */
    onAdd: (component: DiagramComponent) => void
    /** Opens the component types manager (add your own, edit, delete) */
    onManage: () => void
}

/**
 * The component palette: drag a type onto the canvas to drop it there, or press it (mouse or keyboard)
 * to add it in the middle of the canvas. On wide screens it's a column as tall as the canvas (the list
 * scrolls inside it); on narrow screens a row that scrolls sideways.
 */
export default function DiagramPalette({ onAdd, onManage }: DiagramPaletteProps) {
    const titleId = useId()
    const { components, loaded } = useDiagramComponents()

    const onDragStart = (e: DragEvent<HTMLButtonElement>, component: DiagramComponent) => {
        e.dataTransfer.setData(DIAGRAM_KIND_MIME, component.code)
        e.dataTransfer.effectAllowed = 'copy'
    }

    return (
        <div className="relative shrink-0 md:w-52" role="group" aria-labelledby={titleId}>
            <div className="flex flex-col md:absolute md:inset-0">
                <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
                    <h3
                        id={titleId}
                        className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400"
                    >
                        Components
                    </h3>
                    <Button
                        size="xs"
                        variant="plain"
                        icon={<SettingsIcon />}
                        onClick={onManage}
                        title="Add your own component types, or edit and delete them"
                    >
                        Manage
                    </Button>
                </div>
                {!loaded ? (
                    <p className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400" role="status">
                        <Spinner size={16} /> Loading components…
                    </p>
                ) : components.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        No component types yet. Press Manage to add one.
                    </p>
                ) : (
                    <ul className="flex gap-1.5 overflow-x-auto pb-1 md:min-h-0 md:flex-1 md:flex-col md:overflow-x-hidden md:overflow-y-auto md:pr-1 md:pb-0">
                        {components.map((component) => (
                            <li key={component.code} className="shrink-0 md:w-full">
                                <button
                                    type="button"
                                    draggable
                                    onDragStart={(e) => onDragStart(e, component)}
                                    onClick={() => onAdd(component)}
                                    title={`${component.description ? `${component.description} ` : ''}Drag onto the canvas, or press to add.`}
                                    aria-label={`Add ${component.name}`}
                                    className="flex w-full cursor-grab items-center gap-2 rounded-xl border border-gray-200 bg-white px-2 py-1.5 text-left text-sm font-medium whitespace-nowrap text-gray-800 transition hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:cursor-grabbing md:whitespace-normal dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:border-primary"
                                >
                                    <DiagramKindIcon component={component} />
                                    <span className="min-w-0 leading-tight">{component.name}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                <p className="mt-2 shrink-0 text-xs text-gray-500 dark:text-gray-400">
                    Drag onto the canvas, or press to add.
                </p>
            </div>
        </div>
    )
}
