import type { CSSProperties, ReactNode } from 'react'

export interface CommonProps {
    id?: string
    className?: string
    children?: ReactNode
    style?: CSSProperties
}

export interface ProviderProps {
    children: ReactNode
}

export interface Option<T = string> {
    value: T
    label: string
}

export interface BadgeOption extends Option {
    badgeClass?: string
}

/** A page of records plus the total available (lists returned by API routes). */
export interface Collection<T> {
    records: T[]
    total: number
}
