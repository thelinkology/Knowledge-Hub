import classNames from '@/utils/classNames'
import type { ReactNode } from 'react'

interface PageHeaderProps {
    title: ReactNode
    description?: ReactNode
    /** Small line above the title (e.g. a course name or "Quest Builder") */
    eyebrow?: ReactNode
    actions?: ReactNode
    className?: string
}

export default function PageHeader({ title, description, eyebrow, actions, className }: PageHeaderProps) {
    return (
        <div className={classNames('mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between', className)}>
            <div className="min-w-0">
                {eyebrow && (
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</div>
                )}
                <h1 className="text-2xl md:text-3xl">{title}</h1>
                {description && <div className="mt-1.5 max-w-3xl text-gray-500 dark:text-gray-400">{description}</div>}
            </div>
            {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
    )
}
