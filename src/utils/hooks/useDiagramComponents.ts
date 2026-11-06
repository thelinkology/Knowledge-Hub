'use client'

import { useMemo } from 'react'
import { useDiagramComponentsStore } from '@/stores/LibraryStores'
import { componentResolver, sortComponents } from '@/utils/diagram'

/**
 * The architecture diagram component types (from DiagramComponentsSWRProvider) in palette order, and
 * `resolve(code)` for a node's type (deleted types → the fallback look). `loaded` is false until the
 * first response arrives.
 */
export default function useDiagramComponents() {
    const data = useDiagramComponentsStore((s) => s.data)
    return useMemo(() => {
        const components = sortComponents(data ?? [])
        return { components, resolve: componentResolver(components), loaded: data !== undefined }
    }, [data])
}
