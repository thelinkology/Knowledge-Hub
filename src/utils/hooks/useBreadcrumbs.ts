'use client'

import { useEffect } from 'react'
import { create } from 'zustand'
import type { BreadcrumbItem } from '@/components/ui/Breadcrumbs'

interface BreadcrumbsState {
    items: BreadcrumbItem[]
    setItems: (items: BreadcrumbItem[]) => void
}

/** Breadcrumbs shown by the shell (PostLoginLayout); pages set them with usePageBreadcrumbs. */
const useBreadcrumbs = create<BreadcrumbsState>((set) => ({
    items: [],
    setItems: (items) => set({ items }),
}))

/** Sets the shell's breadcrumbs while the page is mounted (compared by value, so inline arrays are fine). */
export function usePageBreadcrumbs(items: BreadcrumbItem[]) {
    const setItems = useBreadcrumbs((state) => state.setItems)
    const key = JSON.stringify(items)
    useEffect(() => {
        setItems(JSON.parse(key) as BreadcrumbItem[])
        return () => setItems([])
    }, [key, setItems])
}

export default useBreadcrumbs
