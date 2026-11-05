'use client'

import Link from 'next/link'
import Menu from '@/components/ui/Menu'
import MenuGroup from '@/components/ui/Menu/MenuGroup'
import MenuItem from '@/components/ui/Menu/MenuItem'
import Tooltip from '@/components/ui/Tooltip'
import RecentItemsMenu from './RecentItemsMenu'
import navigationIcon from '@/configs/icons.config'
import { NAV_ITEM_TYPE_TITLE } from '@/constants/navigation.constant'
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
 * Side-navigation menu in titled sections, with "Recently viewed" at the end of the workspace.
 * Collapsed: icons only, with the title as a tooltip (section titles and recent items hidden).
 */
export default function VerticalMenuContent({
    collapsed,
    routeKey,
    navigationTree,
    direction = 'ltr',
    onMenuItemClick,
}: VerticalMenuContentProps) {
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

    return (
        <Menu className="px-4 pb-4" sideCollapsed={collapsed} defaultActiveKeys={[routeKey]}>
            {navigationTree.map((nav) =>
                nav.type === NAV_ITEM_TYPE_TITLE ? (
                    <MenuGroup key={nav.key} label={nav.title}>
                        {nav.subMenu.map(renderItem)}
                        {nav.key === 'workspace' && !collapsed && <RecentItemsMenu onMenuItemClick={onMenuItemClick} />}
                    </MenuGroup>
                ) : (
                    renderItem(nav)
                ),
            )}
        </Menu>
    )
}
