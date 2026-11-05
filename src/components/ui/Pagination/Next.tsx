'use client'

import classNames from 'classnames'
import { HiChevronRight } from 'react-icons/hi'
import type { CommonProps } from '../@types/common'
import type { MouseEvent } from 'react'

interface NextProps extends CommonProps {
    currentPage: number
    pageCount: number
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
    onNext: (e: MouseEvent<HTMLSpanElement>) => void
}
const Next = (props: NextProps) => {
    const {
        currentPage,
        pageCount,
        pagerClass: {
            default: pagerDefaultClass,
            next: pagerNextClass,
            disabled: pagerDisabledClass,
            inactive: pagerInactiveClass,
        },
        onNext,
    } = props

    const disabled = currentPage === pageCount || pageCount === 0

    const onNextClick = (e: MouseEvent<HTMLSpanElement>) => {
        e.preventDefault()
        if (disabled) {
            return
        }
        onNext(e)
    }

    return (
        <span
            className={classNames(
                pagerDefaultClass,
                pagerNextClass,
                disabled ? pagerDisabledClass : pagerInactiveClass,
            )}
            role="presentation"
            onClick={onNextClick}
        >
            <HiChevronRight />
        </span>
    )
}
export default Next
