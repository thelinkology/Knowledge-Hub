'use client'

import { useEffect, useState } from 'react'
import classNames from '@/utils/classNames'
import type { OutlineHeading } from '@/utils/articleValidation'

interface DocumentOutlineProps {
    /** From getOutline(markdown): the ids match the headings MarkdownContent renders with `headingIds` */
    outline: OutlineHeading[]
    title: string
    className?: string
}

/**
 * “In this article” (Microsoft Learn-style): the document's Heading 2 / Heading 3 list. A click scrolls to
 * the heading (smoothly unless the reader prefers less motion) and puts it in the address bar; the section
 * being read is highlighted.
 */
export default function DocumentOutline({ outline, title, className }: DocumentOutlineProps) {
    const [active, setActive] = useState<string | null>(null)

    // Highlight the last heading above the upper part of the screen
    useEffect(() => {
        if (!outline.length) return
        const update = () => {
            let current: string | null = null
            for (const heading of outline) {
                const element = document.getElementById(heading.id)
                if (element && element.getBoundingClientRect().top <= 120) current = heading.id
            }
            setActive(current ?? outline[0].id)
        }
        update()
        window.addEventListener('scroll', update, { passive: true })
        window.addEventListener('resize', update)
        return () => {
            window.removeEventListener('scroll', update)
            window.removeEventListener('resize', update)
        }
    }, [outline])

    const go = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        const target = document.getElementById(id)
        if (!target) return
        event.preventDefault()
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
        history.replaceState(history.state, '', `#${id}`)
        setActive(id)
        // Move the keyboard focus too, so Tab continues from the section
        target.setAttribute('tabindex', '-1')
        target.focus({ preventScroll: true })
    }

    if (!outline.length) return null

    return (
        <nav aria-label={title} className={classNames('article-outline', className)}>
            <div className="mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">{title}</div>
            <ul className="border-l border-gray-200 text-sm dark:border-gray-700">
                {outline.map((heading) => {
                    const current = heading.id === active
                    return (
                        <li key={heading.id}>
                            <a
                                href={`#${heading.id}`}
                                aria-current={current ? 'location' : undefined}
                                onClick={(event) => go(event, heading.id)}
                                className={classNames(
                                    '-ml-px block border-l-2 py-1 leading-snug',
                                    heading.level === 3 ? 'pl-6' : 'pl-3',
                                    current
                                        ? 'border-primary font-semibold text-primary'
                                        : 'border-transparent text-gray-600 hover:border-gray-400 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
                                )}
                            >
                                {heading.text}
                            </a>
                        </li>
                    )
                })}
            </ul>
        </nav>
    )
}
