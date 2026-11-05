'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Drawer from '@/components/ui/Drawer'
import NavToggle from '@/components/shared/NavToggle'
import VerticalMenuContent from '@/components/template/VerticalMenuContent'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import useNavigation from '@/utils/hooks/useNavigation'
import useTheme from '@/utils/hooks/useTheme'
import queryRoute from '@/utils/queryRoute'
import { DIR_RTL } from '@/constants/theme.constant'

const MobileNavToggle = withHeaderItem(NavToggle)

/** Hamburger + drawer navigation below the `lg` breakpoint. */
export default function MobileNav() {
    const [isOpen, setIsOpen] = useState(false)
    const pathname = usePathname()
    const direction = useTheme((state) => state.direction)
    const { navigationTree } = useNavigation()

    return (
        <>
            <button
                type="button"
                className="block text-2xl lg:hidden"
                onClick={() => setIsOpen(true)}
                aria-label="Open navigation"
                aria-expanded={isOpen}
            >
                <MobileNavToggle toggled={isOpen} variant="menu" />
            </button>
            <Drawer
                title="Navigation"
                isOpen={isOpen}
                bodyClass="p-0"
                width={330}
                placement={direction === DIR_RTL ? 'right' : 'left'}
                onClose={() => setIsOpen(false)}
                onRequestClose={() => setIsOpen(false)}
            >
                {isOpen && (
                    <VerticalMenuContent
                        navigationTree={navigationTree}
                        routeKey={queryRoute(pathname).key}
                        direction={direction}
                        onMenuItemClick={() => setIsOpen(false)}
                    />
                )}
            </Drawer>
        </>
    )
}
