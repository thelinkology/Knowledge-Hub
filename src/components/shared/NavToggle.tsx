import { TbLayoutSidebarLeftCollapse, TbLayoutSidebarLeftExpand, TbMenu2 } from 'react-icons/tb'
import type { CommonProps } from '@/@types/common'

interface NavToggleProps extends CommonProps {
    toggled?: boolean
    /** 'side' shows collapse/expand arrows (desktop); 'menu' a hamburger (mobile) */
    variant?: 'side' | 'menu'
}

/** The icon inside the side-nav / mobile-nav toggles (label is set by the wrapping button). */
export default function NavToggle({ toggled, variant = 'side', className }: NavToggleProps) {
    const Icon = variant === 'menu' ? TbMenu2 : toggled ? TbLayoutSidebarLeftExpand : TbLayoutSidebarLeftCollapse
    return (
        <span className={className} aria-hidden>
            <Icon />
        </span>
    )
}
