import type { Mode, ThemeSchema } from '@/@types/theme'

const toCssVariable = (key: string) => `--${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`

/** Writes a preset's primary colour family to CSS variables (camelCase keys → --kebab-case). */
export default function applyTheme(themeSchema: string, mode: Mode, presets: ThemeSchema) {
    const colors = (presets[themeSchema] ?? presets.default)?.[mode]
    if (!colors) return
    const root = document.documentElement
    for (const [key, value] of Object.entries(colors)) root.style.setProperty(toCssVariable(key), value)
}
