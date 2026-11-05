'use client'

import { CheckIcon, WarningIcon } from '@/configs/icons.config'
import type { PublishIssue } from '@/utils/articleValidation'

interface PublishChecklistProps {
    issues: PublishIssue[]
    published: boolean
    /** Element id to focus for each field (e.g. { title: 'article-title' }) */
    fieldIds: Partial<Record<PublishIssue['field'], string>>
}

/** What still blocks publishing, live as the author edits. Each item jumps to the field to fix. */
export default function PublishChecklist({ issues, published, fieldIds }: PublishChecklistProps) {
    const focusField = (field: PublishIssue['field']) => {
        const id = fieldIds[field]
        const element = id ? document.getElementById(id) : null
        if (!element) return
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        element.focus({ preventScroll: true })
    }

    if (!issues.length) {
        return (
            <p className="flex items-center gap-2 text-sm text-success">
                <CheckIcon aria-hidden /> {published ? 'Published and complete.' : 'Ready to publish.'}
            </p>
        )
    }

    return (
        <div>
            <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">
                {published ? 'Fix these to save — published content must stay complete:' : 'Before you can publish:'}
            </p>
            <ul className="space-y-1.5" aria-live="polite">
                {issues.map((issue) => (
                    <li key={`${issue.field}-${issue.message}`}>
                        <button
                            type="button"
                            onClick={() => focusField(issue.field)}
                            className="flex w-full items-start gap-2 rounded-lg px-2 py-1 text-left text-sm text-warning hover:bg-warning-subtle"
                        >
                            <WarningIcon className="mt-0.5 shrink-0" aria-hidden />
                            <span>{issue.message}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    )
}
