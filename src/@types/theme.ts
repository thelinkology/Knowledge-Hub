import type { Config } from '@/components/ui/ConfigProvider'

export type Mode = 'light' | 'dark'
export type Direction = 'ltr' | 'rtl'
export type ControlSize = 'lg' | 'md' | 'sm'

export interface LayoutConfig {
    type: 'collapsibleSide'
    sideNavCollapse: boolean
}

export type Theme = Config & {
    themeSchema: string
    panelExpand: boolean
    layout: LayoutConfig
}

export type PartialTheme = Partial<Theme>

/** CSS variables set by utils/applyThemeSchema (camelCase → --kebab-case) */
export interface ThemeSchemaColors {
    primary: string
    primaryDeep: string
    primaryMild: string
    primarySubtle: string
    neutral: string
}

export type ThemeSchema = Record<string, Record<Mode, ThemeSchemaColors>>
