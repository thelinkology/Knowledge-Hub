import classNames from '@/utils/classNames'
import type { ReactNode } from 'react'

interface StatTileProps {
    label: string
    value: ReactNode
    hint?: ReactNode
    icon?: ReactNode
    className?: string
}

/** A labelled number for dashboards and reports */
export default function StatTile({ label, value, hint, icon, className }: StatTileProps) {
    return (
        <div
            className={classNames(
                'rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800',
                className,
            )}
        >
            <div className="flex items-center justify-between gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span>{label}</span>
                {icon && <span className="text-lg text-primary">{icon}</span>}
            </div>
            <div className="mt-1 text-2xl font-bold text-gray-900 tabular-nums dark:text-gray-50">{value}</div>
            {hint && <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{hint}</div>}
        </div>
    )
}
