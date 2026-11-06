'use client'

import { useMemo } from 'react'
import { getOutline } from '@/utils/articleValidation'

/**
 * The editor's view of “In this article”: the list readers get, built from the body's Heading and
 * Subheading text styles (## / ### in Markdown). Explains how to get one when there are no headings.
 */
export default function ArticleOutlinePreview({ body }: { body: string }) {
    const outline = useMemo(() => getOutline(body), [body])

    if (!outline.length) {
        return (
            <p className="text-sm text-gray-600 dark:text-gray-400">
                Readers get an “In this article” list next to the article when it has headings. In the toolbar’s text
                style menu choose <strong>Heading</strong> (or <strong>Subheading</strong> for a level below), or start
                a line with <code>##</code> (<code>###</code>) in Markdown. The <strong>Title</strong> style isn’t
                listed: the article’s title is already at the top.
            </p>
        )
    }

    return (
        <>
            <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                Built from the Heading and Subheading text styles.
            </p>
            <ul className="space-y-1 border-l border-gray-200 text-sm dark:border-gray-700">
                {outline.map((heading) => (
                    <li
                        key={heading.id}
                        className={heading.level === 3 ? 'pl-6 text-gray-600 dark:text-gray-400' : 'pl-3'}
                    >
                        {heading.text}
                    </li>
                ))}
            </ul>
        </>
    )
}
