'use client'

import classNames from 'classnames'
import { HiChevronLeft } from 'react-icons/hi'
import type { CommonProps } from '../@types/common'
import type { MouseEvent } from 'react'

interface PrevProps extends CommonProps {
    currentPage: number
    pagerClass: {
        default: string
        inactive: string
        active: string
        disabled: string
        item: string
        first: string
        last: string
        prev: string
        more: string
        next: string
    }
    onPrev: (e: MouseEvent<HTMLSpanElement>) => void
}

const Prev = (props: PrevProps) => {
    const {
        currentPage,
        pagerClass: {
            default: pagerDefaultClass,
            prev: pagerPrevClass,
            disabled: pagerDisabledClass,
            inactive: pagerInactiveClass,
        },
        onPrev,
    } = props

    const disabled = currentPage <= 1

    const onPrevClick = (e: MouseEvent<HTMLSpanElement>) => {
        if (disabled) {
            return
        }
        onPrev(e)
    }

    return (
        <span
            className={classNames(
                pagerDefaultClass,
                pagerPrevClass,
                disabled ? pagerDisabledClass : pagerInactiveClass,
            )}
            role="presentation"
            onClick={onPrevClick}
        >
            <HiChevronLeft />
        </span>
    )
}
export default Prev
