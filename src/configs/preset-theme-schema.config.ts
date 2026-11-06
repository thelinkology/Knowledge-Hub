import type { ThemeSchema } from '@/@types/theme'

/**
 * Primary colour families applied at runtime by utils/applyThemeSchema. 'default' must match the
 * values in assets/styles/tailwind/_tokens.css (which paint the first frame before hydration).
 */
const presetThemeSchemaConfig: ThemeSchema = {
    default: {
        light: {
            primary: '#0f6cbd',
            primaryDeep: '#0c5395',
            primaryMild: '#2886de',
            primarySubtle: 'rgb(15 108 189 / 0.1)',
            neutral: '#ffffff',
        },
        dark: {
            primary: '#9b7bff',
            primaryDeep: '#7640ff',
            primaryMild: '#b9a3ff',
            primarySubtle: 'rgb(118 64 255 / 0.18)',
            neutral: '#02031c',
        },
    },
}

export default presetThemeSchemaConfig
