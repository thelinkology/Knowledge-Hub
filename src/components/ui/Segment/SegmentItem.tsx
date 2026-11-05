import { useMemo } from 'react'
import { useSegment } from './context'
import { SEGMENT_SIZES, SIZES } from '../utils/constants'
import type { CommonProps, TypeAttributes } from '../@types/common'
import type { SegmentValue } from './context'
import type { ReactNode, ComponentPropsWithRef } from 'react'
import classNames from '@/utils/classNames'

type ChildrenParams = {
    active: boolean
    disabled: boolean
    value: string
    onSegmentItemClick: () => void
    sizeClass: string
    className: string
}

export interface SegmentItemProps
    extends Omit<CommonProps, 'children'>, Omit<ComponentPropsWithRef<'button'>, 'children'> {
    children: ((params: ChildrenParams) => ReactNode) | ReactNode
    disabled?: boolean
    size?: TypeAttributes.Size
    value?: string
}

const unwrapArray = (arg: (params: ChildrenParams) => ReactNode) => (Array.isArray(arg) ? arg[0] : arg)

const SegmentItem = (props: SegmentItemProps) => {
    const { children, className, disabled = false, ref, value: valueProp, size, ...rest } = props

    const { value: valueContext, onActive, onDeactivate, selectionType, size: segmentSize } = useSegment()

    const active = (valueContext as string[]).includes(valueProp as string)

    const buttonSize = size || segmentSize

    const sizeClass = useMemo(
        () =>
            buttonSize === SIZES.LG
                ? classNames(SEGMENT_SIZES.lg.h, 'md:px-8 py-2 px-4 text-base')
                : buttonSize === SIZES.SM
                  ? classNames(SEGMENT_SIZES.sm.h, 'px-3 py-2 text-sm')
                  : buttonSize === SIZES.XS
                    ? classNames(SEGMENT_SIZES.xs.h, 'px-3 py-1 text-xs')
                    : classNames(SEGMENT_SIZES.md.h, 'px-5 py-2'), // default MD
        [buttonSize],
    )

    const onSegmentItemClick = () => {
        if (!disabled) {
            if (!active) {
                if (selectionType === 'single') {
                    onActive?.(valueProp as string)
                }
                if (selectionType === 'multiple') {
                    const nextValue = [...(valueContext as string[]), ...[valueProp]] as string[]
                    onActive?.(nextValue)
                }
            } else if (selectionType === 'multiple') {
                onDeactivate?.(valueProp as SegmentValue)
            }
        }
    }

    const itemClassName = classNames(
        'segment-item',
        sizeClass,
        active && 'segment-item-active',
        disabled && 'segment-item-disabled',
        className,
    )

    return typeof children === 'function' ? (
        unwrapArray(children)({
            active,
            onSegmentItemClick,
            disabled,
            value: valueProp,
            className: itemClassName,
            sizeClass,
            ...rest,
        })
    ) : (
        // type="button": a segment inside a form must never submit it
        <button ref={ref} type="button" className={itemClassName} onClick={onSegmentItemClick} {...rest}>
            {children}
        </button>
    )
}

export default SegmentItem
