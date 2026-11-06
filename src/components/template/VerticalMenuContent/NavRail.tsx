'use client'

import Link from 'next/link'
import navigationIcon from '@/configs/icons.config'
import { NAV_ITEM_TYPE_TITLE } from '@/constants/navigation.constant'
import classNames from '@/utils/classNames'
import type { NavigationTree } from '@/@types/navigation'

interface NavRailProps {
    routeKey: string
    navigationTree: NavigationTree[]
    onMenuItemClick?: () => void
}

/**
 * The collapsed side nav as a rail (like Microsoft Fabric's): each item is its icon with a short label
 * underneath; the current page has a bar on the left and the icon in a tinted tile. Sections are
 * separated by a thin rule.
 */
export default function NavRail({ routeKey, navigationTree, onMenuItemClick }: NavRailProps) {
    const groups = navigationTree.map((nav) => (nav.type === NAV_ITEM_TYPE_TITLE ? nav : { ...nav, subMenu: [nav] }))

    return (
        <nav aria-label="Main" className="px-1 pb-4">
            {groups.map((group, index) => (
                <ul
                    key={group.key}
                    aria-label={group.type === NAV_ITEM_TYPE_TITLE ? group.title : undefined}
                    className={classNames(
                        'space-y-1',
                        index > 0 && 'mt-2 border-t border-gray-200 pt-2 dark:border-gray-700',
                    )}
                >
                    {group.subMenu.map((nav) => {
                        const active = nav.key === routeKey
                        const label = nav.shortTitle ?? nav.title
                        return (
                            <li key={nav.key}>
                                <Link
                                    href={nav.path}
                                    onClick={onMenuItemClick}
                                    aria-current={active ? 'page' : undefined}
                                    title={label !== nav.title ? nav.title : undefined}
                                    className={classNames(
                                        'group relative flex flex-col items-center gap-1 rounded-lg px-0.5 py-2 text-center transition-colors focus-visible:outline-2 focus-visible:outline-primary motion-reduce:transition-none',
                                        active
                                            ? 'text-primary'
                                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100',
                                    )}
                                >
                                    {active && (
                                        <span
                                            aria-hidden
                                            className="absolute start-0 top-2 bottom-2 w-[3px] rounded-full bg-primary"
                                        />
                                    )}
                                    <span
                                        aria-hidden
                                        className={classNames(
                                            'flex h-9 w-9 items-center justify-center rounded-lg text-[22px] transition-colors motion-reduce:transition-none',
                                            active ? 'bg-primary-subtle' : 'group-hover:bg-transparent',
                                        )}
                                    >
                                        {navigationIcon[nav.icon]}
                                    </span>
                                    <span
                                        className={classNames(
                                            'line-clamp-2 w-full text-[11px] leading-tight tracking-tight [overflow-wrap:normal]',
                                            active ? 'font-semibold' : 'font-medium',
                                        )}
                                    >
                                        {label}
                                    </span>
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            ))}
        </nav>
    )
}
