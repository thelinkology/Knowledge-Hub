'use client'

import CopyButton from './CopyButton'
import classNames from '@/utils/classNames'

interface CopyFieldProps {
    value: string
    /** What is copied, for screen readers ("the OpenAPI link") */
    what: string
    /** Multi-line text (instructions, a command) instead of one line */
    multiline?: boolean
    className?: string
}

/** A read-only value (link, command, text) shown in monospace with a Copy button */
export default function CopyField({ value, what, multiline, className }: CopyFieldProps) {
    return (
        <div
            className={classNames(
                'flex gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-900',
                multiline ? 'flex-col items-stretch' : 'items-center',
                className,
            )}
        >
            {multiline ? (
                <pre className="max-h-72 overflow-auto px-2 py-1 font-mono text-xs leading-relaxed whitespace-pre-wrap text-gray-800 dark:text-gray-100">
                    {value}
                </pre>
            ) : (
                <code className="min-w-0 flex-1 truncate px-2 font-mono text-sm text-gray-800 select-all dark:text-gray-100">
                    {value || '…'}
                </code>
            )}
            <CopyButton value={value} what={what} className={multiline ? 'self-end' : 'shrink-0'} />
        </div>
    )
}
