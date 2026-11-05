import classNames from '@/utils/classNames'
import type { ComponentType } from 'react'

export interface WithHeaderItemProps {
    className?: string
    hoverable?: boolean
}

/** Gives a header control the shared header-item spacing and hover (assets/styles/template/_header.css). */
export default function withHeaderItem<T extends { className?: string }>(Component: ComponentType<T>) {
    function HeaderItem({ hoverable = true, className, ...props }: T & WithHeaderItemProps) {
        return (
            <Component
                {...(props as T)}
                className={classNames('header-action-item', hoverable && 'header-action-item-hoverable', className)}
            />
        )
    }
    HeaderItem.displayName = `withHeaderItem(${Component.displayName || Component.name || 'Component'})`
    return HeaderItem
}
