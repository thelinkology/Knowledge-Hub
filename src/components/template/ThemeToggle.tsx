'use client'

import withHeaderItem from '@/utils/hoc/withHeaderItem'
import useTheme from '@/utils/hooks/useTheme'
import { DarkModeIcon, LightModeIcon } from '@/configs/icons.config'
import classNames from '@/utils/classNames'

function ThemeToggleButton({ className }: { className?: string }) {
    const mode = useTheme((state) => state.mode)
    const setMode = useTheme((state) => state.setMode)
    const next = mode === 'dark' ? 'light' : 'dark'
    return (
        <button
            type="button"
            className={classNames('text-xl', className)}
            onClick={() => void setMode(next)}
            aria-label={`Switch to ${next} mode`}
            title={`Switch to ${next} mode`}
        >
            {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
        </button>
    )
}

/** Dark (the signature look) / light ("daylight", e.g. for projectors). Saved in a cookie. */
const ThemeToggle = withHeaderItem(ThemeToggleButton)

export default ThemeToggle
