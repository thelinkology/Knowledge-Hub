'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import MenuCollapse from '@/components/ui/Menu/MenuCollapse'
import MenuItem from '@/components/ui/Menu/MenuItem'
import navigationIcon from '@/configs/icons.config'
import type { RecentItem } from '@/stores/RecentItemsStore'

const RECENT_ICON: Record<RecentItem['kind'], React.ReactNode> = {
    article: navigationIcon.article,
    collection: navigationIcon.collection,
    client: navigationIcon.clients,
    asset: navigationIcon.library,
    brd: navigationIcon.brd,
}
import { ensureRecentItemsLoaded, selectRecentItems, useRecentItemsStore } from '@/stores/RecentItemsStore'
import useSession from '@/utils/hooks/useSession'
import classNames from '@/utils/classNames'

interface RecentItemsMenuProps {
    onMenuItemClick?: () => void
}

/** "Recently visited": the courses and quests this user opened last, newest first. Collapsed until opened. */
export default function RecentItemsMenu({ onMenuItemClick }: RecentItemsMenuProps) {
    const { user } = useSession()
    const pathname = usePathname()
    const items = useRecentItemsStore(selectRecentItems(user?.id))

    // Saved in localStorage: read it after the first render so it matches the server's HTML.
    useEffect(() => {
        void ensureRecentItemsLoaded()
    }, [])

    if (!items.length) return null

    return (
        <MenuCollapse
            eventKey="recent"
            label={
                <>
                    <span className="text-2xl">{navigationIcon.recent}</span>
                    <span>Recently visited</span>
                </>
            }
        >
            {items.map((item) => {
                const active = pathname === item.href.split('?')[0]
                return (
                    <MenuItem
                        key={item.id}
                        eventKey={`recent-${item.id}`}
                        className={classNames(active && 'menu-item-active')}
                    >
                        <Link
                            href={item.href}
                            className="flex h-full w-full min-w-0 items-center gap-2"
                            onClick={onMenuItemClick}
                            title={item.subtitle ? `${item.title} · ${item.subtitle}` : item.title}
                        >
                            <span className="shrink-0 text-base opacity-60">{RECENT_ICON[item.kind]}</span>
                            <span className="truncate">{item.title}</span>
                        </Link>
                    </MenuItem>
                )
            })}
        </MenuCollapse>
    )
}
