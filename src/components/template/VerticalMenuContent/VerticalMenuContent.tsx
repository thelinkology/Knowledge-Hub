'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Menu from '@/components/ui/Menu'
import MenuGroup from '@/components/ui/Menu/MenuGroup'
import MenuItem from '@/components/ui/Menu/MenuItem'
import Tooltip from '@/components/ui/Tooltip'
import navigationIcon, { ExpandIcon } from '@/configs/icons.config'
import { NAV_ITEM_TYPE_TITLE } from '@/constants/navigation.constant'
import { useNavSectionsStore } from '@/stores/NavSectionsStore'
import classNames from '@/utils/classNames'
import type { Direction } from '@/@types/theme'
import type { NavigationTree } from '@/@types/navigation'

export interface VerticalMenuContentProps {
    collapsed?: boolean
    routeKey: string
    navigationTree: NavigationTree[]
    direction?: Direction
    onMenuItemClick?: () => void
}

/**
 * Side-navigation menu in titled sections. Each section title collapses/expands its items (remembered in
 * this browser). Collapsed side nav: icons only, with the title as a tooltip, and every section open.
 */
export default function VerticalMenuContent({
    collapsed,
    routeKey,
    navigationTree,
    direction = 'ltr',
    onMenuItemClick,
}: VerticalMenuContentProps) {
    const collapsedSections = useNavSectionsStore((s) => s.collapsed)
    const toggleSection = useNavSectionsStore((s) => s.toggle)

    // Load the saved open/closed sections after mount (the server renders them all open)
    useEffect(() => {
        void useNavSectionsStore.persist.rehydrate()
    }, [])

    const renderItem = (nav: NavigationTree) => {
        const link = (
            <Link href={nav.path} className="flex h-full w-full items-center gap-2" onClick={onMenuItemClick}>
                <span className="text-2xl">{navigationIcon[nav.icon]}</span>
                {!collapsed && <span>{nav.title}</span>}
            </Link>
        )
        return (
            <MenuItem key={nav.key} eventKey={nav.key}>
                {collapsed ? (
                    <Tooltip title={nav.title} placement={direction === 'rtl' ? 'left' : 'right'}>
                        {link}
                    </Tooltip>
                ) : (
                    link
                )}
            </MenuItem>
        )
    }

    const renderSection = (nav: NavigationTree) => {
        if (collapsed) {
            return (
                <MenuGroup key={nav.key} label={null}>
                    {nav.subMenu.map(renderItem)}
                </MenuGroup>
            )
        }
        const closed = !!collapsedSections[nav.key]
        const listId = `nav-section-${nav.key}`
        return (
            <div key={nav.key}>
                <button
                    type="button"
                    onClick={() => toggleSection(nav.key)}
                    aria-expanded={!closed}
                    aria-controls={listId}
                    className="menu-title menu-title-light flex w-full items-center justify-between rounded-lg text-xs tracking-wide hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                >
                    <span>{nav.title}</span>
                    <ExpandIcon
                        aria-hidden
                        className={classNames('text-base transition-transform', closed && '-rotate-90')}
                    />
                </button>
                <div id={listId} hidden={closed}>
                    <MenuGroup label={null}>{nav.subMenu.map(renderItem)}</MenuGroup>
                </div>
            </div>
        )
    }

    return (
        <Menu className="px-4 pb-4" sideCollapsed={collapsed} defaultActiveKeys={[routeKey]}>
            {navigationTree.map((nav) => (nav.type === NAV_ITEM_TYPE_TITLE ? renderSection(nav) : renderItem(nav)))}
        </Menu>
    )
}
