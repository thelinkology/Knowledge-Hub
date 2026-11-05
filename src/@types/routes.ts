import type { ElementType, ReactNode } from 'react'

export interface PageHeaderProps {
    title?: string | ElementType
    description?: string | ReactNode
    contained?: boolean
    extraHeader?: string | ElementType
}

export interface Meta {
    pageContainerType?: 'default' | 'gutterless' | 'contained'
    pageBackgroundType?: 'default' | 'plain'
    header?: PageHeaderProps
    footer?: boolean
}
