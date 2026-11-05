import Link from 'next/link'
import classNames from '@/utils/classNames'
import { NextIcon } from '@/configs/icons.config'

export interface BreadcrumbItem {
    label: string
    href?: string
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[]
    className?: string
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
    if (!items.length) return null
    return (
        <nav className={classNames('flex text-[15px] text-gray-500', className)} aria-label="Breadcrumb">
            <ol className="inline-flex flex-wrap items-center gap-1">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1
                    return (
                        <li key={`${item.label}-${index}`} className="inline-flex items-center">
                            {index > 0 && <NextIcon className="mx-1 text-gray-400" />}
                            {isLast || !item.href ? (
                                <span
                                    className="text-gray-700 dark:text-gray-200"
                                    aria-current={isLast ? 'page' : undefined}
                                >
                                    {item.label}
                                </span>
                            ) : (
                                <Link href={item.href} className="text-primary hover:underline">
                                    {item.label}
                                </Link>
                            )}
                        </li>
                    )
                })}
            </ol>
        </nav>
    )
}

export default Breadcrumbs
