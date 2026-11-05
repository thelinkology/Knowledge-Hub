'use client'

import { useSWRBrd } from '@/services/brds'
import { useBrdStore } from '@/stores/BrdStores'
import useSyncResource from '@/utils/hooks/useSyncResource'
import type { Brd } from '@/@types/brds/Brd'
import type { ProviderProps } from '@/@types/common'

interface BrdSWRProviderProps extends ProviderProps {
    brdId: string
    /** Server-rendered first load */
    brd?: Brd
}

/** One BRD → useBrdStore(brdId) (the BRD page and the editor) */
export default function BrdSWRProvider({ brdId, brd, children }: BrdSWRProviderProps) {
    // No refetch on focus: in the editor the form is the working copy; stores are refreshed after saves
    const swr = useSWRBrd(brdId, { fallbackData: brd, revalidateOnFocus: false })
    const setData = useBrdStore(brdId, (s) => s.setData)
    const setLoading = useBrdStore(brdId, (s) => s.setLoading)
    const setError = useBrdStore(brdId, (s) => s.setError)
    const setRefresh = useBrdStore(brdId, (s) => s.setRefresh)
    useSyncResource(swr, { setData, setLoading, setError, setRefresh })
    return <>{children}</>
}
