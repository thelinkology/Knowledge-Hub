import classNames from 'classnames'
import { cloneElement, isValidElement } from 'react'
import { TbChevronDown, TbChevronUp, TbChevronRight, TbChevronLeft } from 'react-icons/tb'
import type { CommonProps } from '../@types/common'
import type { Placement } from '@floating-ui/react'
import type { ReactNode, HTMLProps, Ref } from 'react'

export interface DropdownToggleSharedProps {
    renderTitle?: ReactNode
    placement?: Placement
    toggleClassName?: string
    disabled?: boolean
}

interface DropdownToggleProps extends CommonProps, DropdownToggleSharedProps {
    id?: string
    ref?: Ref<HTMLElement>
}

const DropdownToggleDefaultContent = ({
    placement,
    children,
}: {
    placement: Placement
    children: string | ReactNode
}) => {
    if (placement && placement.includes('right')) {
        return (
            <>
                {children}
                <TbChevronRight />
            </>
        )
    }

    if (placement && placement.includes('left')) {
        return (
            <>
                <TbChevronLeft />
                {children}
            </>
        )
    }

    if (placement && placement.includes('right')) {
        return (
            <>
                {children}
                <TbChevronUp />
            </>
        )
    }

    return (
        <>
            {children}
            <TbChevronDown />
        </>
    )
}

const DropdownToggle = (props: DropdownToggleProps & HTMLProps<HTMLDivElement>) => {
    const {
        className,
        renderTitle,
        children,
        placement = 'bottom-start',
        disabled,
        ref,
        toggleClassName,
        ...rest
    } = props

    const toggleClass = 'dropdown-toggle'
    const disabledClass = 'dropdown-toggle-disabled'

    const dropdownToggleClass = classNames(toggleClass, className, toggleClassName, disabled && disabledClass)

    const dropdownToggleDefaultClass = classNames(dropdownToggleClass, 'dropdown-toggle-default')

    // A custom trigger (a Button) is the control itself: it gets the menu props (aria-expanded, handlers,
    // the anchor ref) so screen readers meet one button instead of a widget wrapped around another
    if (isValidElement<HTMLProps<HTMLElement>>(renderTitle)) {
        return (
            <div className={dropdownToggleClass}>
                {cloneElement(renderTitle, { ...rest, ref } as HTMLProps<HTMLElement>)}
            </div>
        )
    }

    if (renderTitle) {
        return (
            <div className={dropdownToggleClass} {...rest} ref={ref}>
                {renderTitle}
            </div>
        )
    }

    return (
        <div ref={ref} className={dropdownToggleDefaultClass} role="button" tabIndex={disabled ? -1 : 0} {...rest}>
            <span className="flex items-center gap-1">
                <DropdownToggleDefaultContent placement={placement}>{children}</DropdownToggleDefaultContent>
            </span>
        </div>
    )
}

export default DropdownToggle
