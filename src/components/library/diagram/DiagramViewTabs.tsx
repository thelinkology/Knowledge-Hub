'use client'

import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import classNames from '@/utils/classNames'
import type { DiagramView } from '@/@types/library/Diagram'

interface DiagramViewTabsProps {
    views: DiagramView[]
    activeId: string
    onSelect: (viewId: string) => void
    /** id of the panel the tabs control */
    panelId: string
    /** Extra controls after the tabs (the editor's "Add view") */
    actions?: ReactNode
    className?: string
}

/** The diagram's scenario tabs ("GL planning only" | "Advanced FP&A planning"), arrow keys move between them */
export default function DiagramViewTabs({
    views,
    activeId,
    onSelect,
    panelId,
    actions,
    className,
}: DiagramViewTabsProps) {
    const list = useRef<HTMLDivElement | null>(null)

    const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
        const last = views.length - 1
        const to =
            e.key === 'ArrowRight'
                ? index === last
                    ? 0
                    : index + 1
                : e.key === 'ArrowLeft'
                  ? index === 0
                      ? last
                      : index - 1
                  : e.key === 'Home'
                    ? 0
                    : e.key === 'End'
                      ? last
                      : null
        if (to === null) return
        e.preventDefault()
        onSelect(views[to].id)
        list.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[to]?.focus()
    }

    return (
        <div
            className={classNames(
                'flex flex-wrap items-end gap-2 border-b border-gray-200 dark:border-gray-700',
                className,
            )}
        >
            <div ref={list} role="tablist" aria-label="Diagram views" className="-mb-px flex min-w-0 flex-wrap">
                {views.map((view, index) => {
                    const active = view.id === activeId
                    return (
                        <button
                            key={view.id}
                            type="button"
                            role="tab"
                            id={`${panelId}-tab-${view.id}`}
                            aria-selected={active}
                            aria-controls={panelId}
                            tabIndex={active ? 0 : -1}
                            onClick={() => onSelect(view.id)}
                            onKeyDown={(e) => onKeyDown(e, index)}
                            className={classNames(
                                'max-w-[16rem] truncate border-b-2 px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                                active
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-gray-600 hover:text-primary dark:text-gray-300',
                            )}
                        >
                            {view.name.trim() || 'Untitled view'}
                        </button>
                    )
                })}
            </div>
            {actions && <div className="mb-1 ml-auto flex items-center gap-1">{actions}</div>}
        </div>
    )
}
