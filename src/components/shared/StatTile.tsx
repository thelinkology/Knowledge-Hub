import classNames from '@/utils/classNames'
import type { ReactNode } from 'react'

/** A soft colour for the tile: a pastel gradient, a tinted icon tile and a faint glow in the corner */
export type StatTone = 'blue' | 'violet' | 'teal' | 'amber' | 'rose' | 'green'

interface StatTileProps {
    label: string
    value: ReactNode
    hint?: ReactNode
    icon?: ReactNode
    /** Without a tone the tile is plain (white card) */
    tone?: StatTone
    className?: string
}

// Whole class names (not built from parts) so Tailwind keeps them
const TONES: Record<StatTone, { card: string; icon: string; glow: string }> = {
    blue: {
        card: 'border-sky-100 from-sky-50 dark:border-sky-400/20 dark:from-sky-500/15',
        icon: 'bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300',
        glow: 'bg-sky-200/60 dark:bg-sky-400/15',
    },
    violet: {
        card: 'border-violet-100 from-violet-50 dark:border-violet-400/20 dark:from-violet-500/15',
        icon: 'bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300',
        glow: 'bg-violet-200/60 dark:bg-violet-400/15',
    },
    teal: {
        card: 'border-teal-100 from-teal-50 dark:border-teal-400/20 dark:from-teal-500/15',
        icon: 'bg-teal-100 text-teal-700 dark:bg-teal-400/15 dark:text-teal-300',
        glow: 'bg-teal-200/60 dark:bg-teal-400/15',
    },
    amber: {
        card: 'border-amber-100 from-amber-50 dark:border-amber-400/20 dark:from-amber-500/15',
        icon: 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
        glow: 'bg-amber-200/60 dark:bg-amber-400/15',
    },
    rose: {
        card: 'border-rose-100 from-rose-50 dark:border-rose-400/20 dark:from-rose-500/15',
        icon: 'bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300',
        glow: 'bg-rose-200/60 dark:bg-rose-400/15',
    },
    green: {
        card: 'border-emerald-100 from-emerald-50 dark:border-emerald-400/20 dark:from-emerald-500/15',
        icon: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300',
        glow: 'bg-emerald-200/60 dark:bg-emerald-400/15',
    },
}

/** A labelled number for dashboards and reports */
export default function StatTile({ label, value, hint, icon, tone, className }: StatTileProps) {
    const colors = tone ? TONES[tone] : null
    return (
        <div
            className={classNames(
                'relative isolate overflow-hidden rounded-2xl border p-4',
                colors
                    ? classNames('bg-gradient-to-br to-white to-70% dark:to-gray-800', colors.card)
                    : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800',
                className,
            )}
        >
            {colors && (
                <span
                    aria-hidden
                    className={classNames(
                        'absolute -top-8 -right-8 -z-10 h-24 w-24 rounded-full blur-2xl',
                        colors.glow,
                    )}
                />
            )}
            <div className="flex items-center justify-between gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span>{label}</span>
                {icon &&
                    (colors ? (
                        <span
                            aria-hidden
                            className={classNames(
                                'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg',
                                colors.icon,
                            )}
                        >
                            {icon}
                        </span>
                    ) : (
                        <span className="text-lg text-primary">{icon}</span>
                    ))}
            </div>
            <div
                className={classNames(
                    'text-2xl font-bold text-gray-900 tabular-nums dark:text-gray-50',
                    colors ? '-mt-1' : 'mt-1',
                )}
            >
                {value}
            </div>
            {hint && <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{hint}</div>}
        </div>
    )
}
