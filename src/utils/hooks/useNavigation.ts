'use client'

import { useMemo } from 'react'
import navigationConfig from '@/configs/navigation.config'
import { NAV_ITEM_TYPE_TITLE } from '@/constants/navigation.constant'
import useSession from './useSession'
import type { NavigationTree } from '@/@types/navigation'

/** The side navigation filtered to what the user may use (empty sections dropped). */
export default function useNavigation() {
    const { user } = useSession()

    const navigationTree = useMemo(() => {
        const allowed = (nav: NavigationTree) =>
            nav.authority.length === 0 || nav.authority.some((p) => user?.permissions.includes(p))
        return navigationConfig
            .filter(allowed)
            .map((nav) => (nav.type === NAV_ITEM_TYPE_TITLE ? { ...nav, subMenu: nav.subMenu.filter(allowed) } : nav))
            .filter((nav) => nav.type !== NAV_ITEM_TYPE_TITLE || nav.subMenu.length > 0)
    }, [user])

    return { navigationTree }
}
