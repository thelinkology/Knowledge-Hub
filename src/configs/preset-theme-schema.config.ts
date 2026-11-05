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
            primary: '#479ef5',
            primaryDeep: '#2886de',
            primaryMild: '#77b7f7',
            primarySubtle: 'rgb(71 158 245 / 0.14)',
            neutral: '#050b18',
        },
    },
}

export default presetThemeSchemaConfig
