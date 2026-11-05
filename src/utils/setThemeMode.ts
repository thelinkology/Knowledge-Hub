import { MODE_DARK } from '@/constants/theme.constant'
import type { Mode } from '@/@types/theme'

/** Dark mode is the `dark` class on <html> (Tailwind `dark:` variant + token overrides). */
export function setThemeMode(mode: Mode) {
    const root = document.documentElement
    root.classList.toggle('dark', mode === MODE_DARK)
    root.style.colorScheme = mode
}
