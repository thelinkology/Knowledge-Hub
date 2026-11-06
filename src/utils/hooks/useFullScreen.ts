'use client'

import { useEffect, useState } from 'react'

/**
 * Full-screen state for a panel (the diagram designer and viewer): while on, the page behind doesn't
 * scroll and Escape leaves — unless `escapeLeaves` is false (a dialog is open) or something else already
 * handled the key (a menu closing).
 */
export default function useFullScreen(escapeLeaves = true) {
    const [fullScreen, setFullScreen] = useState(false)

    useEffect(() => {
        if (!fullScreen) return
        const previous = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && escapeLeaves && !e.defaultPrevented) setFullScreen(false)
        }
        window.addEventListener('keydown', onKey)
        return () => {
            document.body.style.overflow = previous
            window.removeEventListener('keydown', onKey)
        }
    }, [fullScreen, escapeLeaves])

    return [fullScreen, setFullScreen] as const
}
