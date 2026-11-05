'use client'

import withHeaderItem from '@/utils/hoc/withHeaderItem'
import useTheme from '@/utils/hooks/useTheme'
import classNames from '@/utils/classNames'
import NavToggle from '@/components/shared/NavToggle'
import type { CommonProps } from '@/@types/common'

const SideNavToggleButton = ({ className }: CommonProps) => {
    const { layout, setSideNavCollapse } = useTheme((state) => state)

    const sideNavCollapse = layout.sideNavCollapse

    const onCollapse = () => {
        setSideNavCollapse(!sideNavCollapse)
    }

    return (
        <button
            type="button"
            className={classNames('hidden lg:block', className)}
            onClick={onCollapse}
            aria-label={sideNavCollapse ? 'Expand navigation' : 'Collapse navigation'}
        >
            <NavToggle className="text-2xl" toggled={sideNavCollapse} />
        </button>
    )
}

const SideNavToggle = withHeaderItem(SideNavToggleButton)

export default SideNavToggle
