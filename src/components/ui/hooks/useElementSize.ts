import { useState, useEffect } from 'react'

interface UseElementSize {
    width?: number
    height?: number
}
export default function useElementSize(element: HTMLElement | null | undefined) {
    const [elementSize, setElementSize] = useState<UseElementSize>({ width: undefined, height: undefined }) // note: must start as undefined (not read from `element`) so the client's first render matches the server-rendered markup (avoids a hydration mismatch that forces React to re-mount/re-render the subtree, seen as a flicker)
    useEffect(() => {
        if (!element) {
            return
        }
        function handleResize() {
            const newElementSize = { width: element?.clientWidth, height: element?.clientHeight }
            setElementSize((prev) =>
                prev.width === newElementSize.width && prev.height === newElementSize.height ? prev : newElementSize,
            ) // if possible, keep the same reference to avoid a redundant re-render when the size hasn't actually changed
        }
        const resizeObserver = new ResizeObserver(handleResize)
        resizeObserver.observe(element)
        handleResize()
        return () => {
            // on unmount, remove the resize observer
            resizeObserver.disconnect()
        }
    }, [element])
    return elementSize
}
export function useElementWidth(element: HTMLElement | null | undefined) {
    const { width } = useElementSize(element)
    return width
}
export function useElementHeight(element: HTMLElement | null | undefined) {
    const { height } = useElementSize(element)
    return height
}
