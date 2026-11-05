'use client'

import { useContext } from 'react'
import ThemeContext from '@/components/template/Theme/ThemeContext'
import type { Mode, Theme } from '@/@types/theme'

export interface ThemeState extends Theme {
    setMode: (mode: Mode) => Promise<void>
    setSideNavCollapse: (collapsed: boolean) => Promise<void>
}

/** Theme state + setters (saved to the theme cookie). Read with a selector: `useTheme((s) => s.mode)`. */
export default function useTheme<T>(selector: (state: ThemeState) => T): T {
    const { theme, setTheme } = useContext(ThemeContext)
    return selector({
        ...theme,
        setMode: async (mode) => setTheme((prev) => ({ ...prev, mode })),
        setSideNavCollapse: async (sideNavCollapse) =>
            setTheme((prev) => ({ ...prev, layout: { ...theme.layout, ...prev.layout, sideNavCollapse } })),
    })
}
