'use client'

import { useSWRAssets } from '@/services/library'
import { useSWRClients } from '@/services/clients'
import { useClientOptionsStore, useLibraryStore } from '@/stores/LibraryStores'
import useSyncResource from '@/utils/hooks/useSyncResource'
import type { ProviderProps } from '@/@types/common'

/** Assets matching the library's search / client / product filters → useLibraryStore (kind is filtered in the browser) */
export function LibrarySWRProvider({ children }: ProviderProps) {
    const query = useLibraryStore((s) => s.query)
    const swr = useSWRAssets({
        q: query.q || undefined,
        clientId: query.clientId ?? undefined,
        productId: query.productId ?? undefined,
    })
    const setData = useLibraryStore((s) => s.setData)
    const setLoading = useLibraryStore((s) => s.setLoading)
    const setError = useLibraryStore((s) => s.setError)
    const setRefresh = useLibraryStore((s) => s.setRefresh)
    useSyncResource(swr, { setData, setLoading, setError, setRefresh })
    return <>{children}</>
}

/** Every client (for filters and pickers) → useClientOptionsStore */
export function ClientOptionsSWRProvider({ children }: ProviderProps) {
    const swr = useSWRClients()
    const setData = useClientOptionsStore((s) => s.setData)
    const setLoading = useClientOptionsStore((s) => s.setLoading)
    const setError = useClientOptionsStore((s) => s.setError)
    const setRefresh = useClientOptionsStore((s) => s.setRefresh)
    useSyncResource(swr, { setData, setLoading, setError, setRefresh })
    return <>{children}</>
}
