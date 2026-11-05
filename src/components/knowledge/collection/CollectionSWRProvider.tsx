'use client'

import { ProductsSWRProvider } from '@/components/knowledge/reader/ArticleSWRProvider'
import { useSWRCollection, type CollectionDetail } from '@/services/knowledge'
import { useCollectionStore } from '@/stores/AppStores'
import useSyncResource from '@/utils/hooks/useSyncResource'
import type { ProviderProps } from '@/@types/common'

interface CollectionSWRProviderProps extends ProviderProps {
    collectionId: string
    /** Server-rendered first load */
    detail?: CollectionDetail
}

/** A collection and its articles → useCollectionStore(collectionId); products → useProductsStore */
export default function CollectionSWRProvider({ collectionId, detail, children }: CollectionSWRProviderProps) {
    const swr = useSWRCollection(collectionId, { fallbackData: detail })
    const setData = useCollectionStore(collectionId, (s) => s.setData)
    const setLoading = useCollectionStore(collectionId, (s) => s.setLoading)
    const setError = useCollectionStore(collectionId, (s) => s.setError)
    const setRefresh = useCollectionStore(collectionId, (s) => s.setRefresh)
    useSyncResource(swr, { setData, setLoading, setError, setRefresh })
    return <ProductsSWRProvider>{children}</ProductsSWRProvider>
}
