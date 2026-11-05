import classNames from '@/utils/classNames'
import type { ReactNode } from 'react'

interface EmptyStateProps {
    icon?: ReactNode
    title: string
    /** Why it's empty and what to do next */
    description?: ReactNode
    action?: ReactNode
    className?: string
    compact?: boolean
}

export default function EmptyState({ icon, title, description, action, className, compact }: EmptyStateProps) {
    return (
        <div
            className={classNames(
                'flex flex-col items-center justify-center text-center',
                compact ? 'gap-2 py-6' : 'gap-3 py-12',
                className,
            )}
        >
            {icon && (
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-subtle text-3xl text-primary">
                    {icon}
                </span>
            )}
            <h4 className="text-base font-semibold">{title}</h4>
            {description && <div className="max-w-md text-sm text-gray-500 dark:text-gray-400">{description}</div>}
            {action && <div className="mt-2">{action}</div>}
        </div>
    )
}
