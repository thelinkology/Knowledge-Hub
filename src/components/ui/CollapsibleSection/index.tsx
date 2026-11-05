'use client'

import { useEffect, useState } from 'react'
import Menu from '@/components/ui/Menu'
//import type { MouseEvent } from 'react'
import classNames from '@/utils/classNames'

interface CollapsibleSectionProps {
    className?: string
    itemClass?: string
    label: string | React.ReactNode | ((props: { expanded: boolean; toggle: () => void }) => React.ReactNode)
    expanded?: boolean
    onChange?: (expanded: boolean) => void
    children: React.ReactNode
}
export default function CollapsibleSection(props: CollapsibleSectionProps) {
    const { className, itemClass, label, onChange, children } = props
    //
    const [expanded, setExpanded] = useState<boolean>(props.expanded ?? true)
    useEffect(() => setExpanded(props.expanded ?? true), [props.expanded])
    //
    return (
        <Menu className={classNames('collapsible-section w-full mb-4', className)}>
            <Menu.MenuCollapse
                className={itemClass}
                label={
                    typeof label === 'function'
                        ? label({
                              expanded,
                              toggle: () => {
                                  setExpanded((prev) => !prev)
                                  onChange?.(!expanded)
                              },
                          })
                        : label
                }
                expanded={expanded}
                onToggle={() => {
                    setExpanded((prev) => !prev)
                    onChange?.(!expanded)
                }}
                indent={false}
                dotIndent={false}
            >
                <div className={classNames('collapsible-content w-full')} hidden={!expanded}>
                    {children}
                </div>
            </Menu.MenuCollapse>
        </Menu>
    )
}
