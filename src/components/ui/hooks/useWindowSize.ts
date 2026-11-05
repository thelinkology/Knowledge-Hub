'use client'

import { useState, useEffect } from 'react'

interface UseWindowSize {
    width?: number
    height?: number
}
export default function useWindowSize() {
    const [windowSize, setWindowSize] = useState<UseWindowSize>({ width: undefined, height: undefined }) // note: must start as undefined (not read from `window`) so the client's first render matches the server-rendered markup (avoids a hydration mismatch that forces React to re-mount/re-render the subtree, seen as a flicker)
    useEffect(() => {
        if (typeof window === 'undefined') {
            return
        }
        function handleResize() {
            const newWindowSize = { width: window.innerWidth, height: window.innerHeight }
            setWindowSize((prev) =>
                prev.width === newWindowSize.width && prev.height === newWindowSize.height ? prev : newWindowSize,
            ) // if possible, keep the same reference to avoid a redundant re-render when the size hasn't actually changed
        }
        window.addEventListener('resize', handleResize)
        handleResize()
        return () => {
            // on unmount, remove the resize event listener
            window.removeEventListener('resize', handleResize)
        }
    }, [])
    return windowSize
}
export function useWindowWidth() {
    const { width } = useWindowSize()
    return width
}
export function useWindowHeight() {
    const { height } = useWindowSize()
    return height
}
