'use client'

import { createContext } from 'react'
import { themeConfig } from '@/configs/theme.config'
import type { Theme, PartialTheme } from '@/@types/theme'
import { defaultConfig } from '@/components/ui/ConfigProvider'

interface IThemeContext {
    theme: Theme
    setTheme: (payload: ((param: PartialTheme) => PartialTheme) | PartialTheme) => void
}
const ThemeContext = createContext<IThemeContext>({
    theme: { ...defaultConfig, ...themeConfig },
    setTheme: () => {},
})
export default ThemeContext
