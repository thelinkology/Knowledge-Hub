'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import classNames from 'classnames'
import { HiOutlineChevronDoubleLeft, HiOutlineDotsHorizontal, HiChevronDoubleRight } from 'react-icons/hi'

const PAGER_COUNT = 7

type More = 'nextMore' | 'prevMore'

type MoreProps = {
    className: string
    onArrow: (more: More) => void
}

const NextMore = ({ className, onArrow }: MoreProps) => {
    const [quickNextArrowIcon, setQuickNextArrowIcon] = useState(false)

    return (
        <li
            className={className}
            role="presentation"
            onMouseEnter={() => {
                setQuickNextArrowIcon(true)
            }}
            onMouseLeave={() => {
                setQuickNextArrowIcon(false)
            }}
            onClick={() => onArrow('nextMore')}
        >
            {quickNextArrowIcon ? <HiChevronDoubleRight /> : <HiOutlineDotsHorizontal />}
        </li>
    )
}

const PrevMore = ({ className, onArrow }: MoreProps) => {
    const [quickPrevArrowIcon, setQuickPrevArrowIcon] = useState(false)

    return (
        <li
            className={className}
            role="presentation"
            onMouseEnter={() => {
                setQuickPrevArrowIcon(true)
            }}
            onMouseLeave={() => {
                setQuickPrevArrowIcon(false)
            }}
            onClick={() => onArrow('prevMore')}
        >
            {quickPrevArrowIcon ? <HiOutlineChevronDoubleLeft /> : <HiOutlineDotsHorizontal />}
        </li>
    )
}

type PagersProps = {
    pageCount: number
    currentPage: number
    pagerClass: {
        default: string
        inactive: string
        active: string
        disabled: string
        first: string
        item: string
        last: string
        prev: string
        more: string
        next: string
    }
    onChange: (page: number) => void
}
const Pagers = (props: PagersProps) => {
    const {
        pageCount,
        currentPage,
        onChange,
        pagerClass: {
            default: pagerDefaultClass,
            inactive: pagerInactiveClass,
            active: pagerActiveClass,
            item: pagerItemClass,
            first: pagerFirstClass,
            last: pagerLastClass,
            more: pagerMoreClass,
        },
    } = props

    const [showPrevMore, setShowPrevMore] = useState(false)
    const [showNextMore, setShowNextMore] = useState(false)
    useEffect(() => {
        if (pageCount > PAGER_COUNT) {
            if (currentPage > PAGER_COUNT - 2) {
                setShowPrevMore(true)
            }
            if (currentPage < pageCount - 2) {
                setShowNextMore(true)
            }
            if (currentPage >= pageCount - 3 && currentPage <= pageCount) {
                setShowNextMore(false)
            }
            if (currentPage >= 1 && currentPage <= 4) {
                setShowPrevMore(false)
            }
        } else {
            setShowPrevMore(false)
            setShowNextMore(false)
        }
    }, [currentPage, pageCount])

    const onPagerClick = (e: React.MouseEvent<HTMLLIElement, MouseEvent>, value: number) => {
        e.preventDefault()
        //
        const newPage = !(typeof value === 'number' && value > 0) ? 1 : value > pageCount ? pageCount : value
        if (newPage !== currentPage) {
            onChange(newPage)
        }
    }

    const onArrowClick = useCallback(
        (e: More) => {
            let newPage = currentPage
            if (e === 'nextMore') {
                newPage = currentPage + 5
            }
            if (e === 'prevMore') {
                newPage = currentPage - 5
            }
            onChange(newPage)
        },
        [currentPage, onChange],
    )

    const intermediatePageNums = useMemo(() => {
        const pageNums = []
        if (showPrevMore && !showNextMore) {
            const startPage = pageCount - (PAGER_COUNT - 2)
            for (let i = startPage; i < pageCount; i++) {
                pageNums.push(i)
            }
        } else if (!showPrevMore && showNextMore) {
            for (let i = 2; i < PAGER_COUNT; i++) {
                pageNums.push(i)
            }
        } else if (showPrevMore && showNextMore) {
            const offset = Math.floor(PAGER_COUNT / 2) - 1
            const maxRange = currentPage >= pageCount - 2 && currentPage <= pageCount
            for (let i = currentPage - offset; i <= currentPage + (maxRange ? 0 : offset); i++) {
                pageNums.push(i)
            }
        } else {
            for (let i = 2; i < pageCount; i++) {
                pageNums.push(i)
            }
        }
        if (pageNums.length > PAGER_COUNT) {
            return []
        }
        return pageNums
    }, [showPrevMore, showNextMore, currentPage, pageCount])

    const getItemClass = (num: number) =>
        classNames(
            pagerDefaultClass,
            pagerItemClass,
            num === 1 ? pagerFirstClass : num === pageCount ? pagerLastClass : '',
            num === currentPage ? pagerActiveClass : pagerInactiveClass,
        )
    return (
        <ul>
            {pageCount > 0 && (
                <li className={getItemClass(1)} role="presentation" onClick={(e) => onPagerClick(e, 1)}>
                    1
                </li>
            )}
            {showPrevMore && (
                <PrevMore
                    className={classNames(pagerDefaultClass, pagerMoreClass, pagerInactiveClass)}
                    onArrow={(arrow) => onArrowClick(arrow)}
                />
            )}
            {intermediatePageNums.map((pager, index) => (
                <li
                    key={index}
                    className={getItemClass(pager)}
                    role="presentation"
                    onClick={(e) => onPagerClick(e, pager)}
                >
                    {pager}
                </li>
            ))}
            {showNextMore && (
                <NextMore
                    className={classNames(pagerDefaultClass, pagerMoreClass, pagerInactiveClass)}
                    onArrow={(arrow) => onArrowClick(arrow)}
                />
            )}
            {pageCount > 1 && (
                <li className={getItemClass(pageCount)} role="presentation" onClick={(e) => onPagerClick(e, pageCount)}>
                    {pageCount}
                </li>
            )}
        </ul>
    )
}
export default Pagers
