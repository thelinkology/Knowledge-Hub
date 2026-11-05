'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Warns before unsaved work is lost: closing or reloading the tab (the browser's own prompt), and
 * following any in-app link — sidebar, breadcrumbs, lists — which is paused until the user
 * confirms. Render the returned `pendingHref` as a confirm dialog and call `leave` / `stay`.
 */
export const useUnsavedChangesGuard = (hasUnsavedChanges: () => boolean) => {
    const router = useRouter()
    const check = useRef(hasUnsavedChanges)
    const [pendingHref, setPendingHref] = useState<string | null>(null)

    useEffect(() => {
        check.current = hasUnsavedChanges
    })

    useEffect(() => {
        const onBeforeUnload = (e: BeforeUnloadEvent) => {
            if (check.current()) e.preventDefault()
        }
        // Capture phase on window runs before Next's <Link> handler, so the navigation can be held.
        const onClick = (e: MouseEvent) => {
            if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
            const anchor = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
            if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return
            const url = new URL(anchor.href, location.href)
            if (url.origin !== location.origin || url.pathname.startsWith('/api/')) return
            if (url.pathname === location.pathname) return // tabs and filters on this page
            if (!check.current()) return
            e.preventDefault()
            e.stopPropagation()
            setPendingHref(url.pathname + url.search + url.hash)
        }
        window.addEventListener('beforeunload', onBeforeUnload)
        window.addEventListener('click', onClick, true)
        return () => {
            window.removeEventListener('beforeunload', onBeforeUnload)
            window.removeEventListener('click', onClick, true)
        }
    }, [])

    return {
        pendingHref,
        stay: () => setPendingHref(null),
        leave: () => {
            const href = pendingHref
            setPendingHref(null)
            if (href) router.push(href)
        },
    }
}

export default useUnsavedChangesGuard
