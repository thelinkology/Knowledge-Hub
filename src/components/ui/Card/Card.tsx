'use client'

import classNames from 'classnames'
import { useConfig } from '../ConfigProvider'
import type { CommonProps } from '../@types/common'
import type { ReactNode, ComponentPropsWithRef, MouseEvent, Ref } from 'react'
import Loading from '@/components/shared/Loading'

type CardHeader = {
    content?: string | ReactNode
    className?: string
    bordered?: boolean
    extra?: string | ReactNode
}

type CardFooter = {
    content?: string | ReactNode
    className?: string
    bordered?: boolean
}

export interface CardProps extends CommonProps, Omit<ComponentPropsWithRef<'div'>, 'onClick'> {
    clickable?: boolean
    header?: CardHeader
    bodyClass?: string
    footer?: CardFooter
    bordered?: boolean
    ref?: Ref<HTMLDivElement>
    onClick?: (e: MouseEvent<HTMLDivElement>) => void
    loading?: boolean
}

const defaultHeaderConfig: CardHeader = {
    bordered: true,
}

const defaultFooterConfig: CardHeader = {
    bordered: true,
}

const Card = (props: CardProps) => {
    const { ui } = useConfig()

    const {
        bodyClass,
        children,
        className,
        clickable = false,
        bordered = ui?.card?.cardBordered ?? true,
        header = {},
        footer = {},
        ref,
        onClick,
        loading,
        ...rest
    } = props

    const headerProps = {
        ...defaultHeaderConfig,
        ...header,
    }

    const footerProps = {
        ...defaultFooterConfig,
        ...footer,
    }

    const cardClass = classNames(
        'card',
        className,
        bordered ? `card-border` : `card-shadow`,
        clickable && 'cursor-pointer user-select-none',
    )

    const cardBodyClass = classNames('card-body', bodyClass, loading ? 'invisible' : null)
    const cardHeaderClass = classNames(
        'card-header',
        headerProps.bordered ? 'card-header-border' : null,
        headerProps.extra ? 'card-header-extra' : null,
        headerProps.className,
        loading ? 'invisible' : null,
    )
    const cardFooterClass = classNames(
        'card-footer',
        footerProps.bordered && `card-footer-border`,
        footerProps.className,
        loading ? 'invisible' : null,
    )

    const renderHeader = () => {
        if (typeof headerProps.content === 'string') {
            return <h4>{headerProps.content}</h4>
        }
        return <>{headerProps.content}</>
    }

    const handleClick = (e: MouseEvent<HTMLDivElement>) => {
        onClick?.(e)
    }

    return (
        <div ref={ref} className={cardClass} role="presentation" onClick={handleClick} {...rest}>
            {headerProps.content && (
                <div className={cardHeaderClass}>
                    {renderHeader()}
                    {headerProps.extra && <span>{headerProps.extra}</span>}
                </div>
            )}
            {typeof loading === 'boolean' && <Loading loading={loading} />}
            <div className={cardBodyClass}>{children}</div>
            {footerProps.content && <div className={cardFooterClass}>{footerProps.content}</div>}
        </div>
    )
}

export default Card
