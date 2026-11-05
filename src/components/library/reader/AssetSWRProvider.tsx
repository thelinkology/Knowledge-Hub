'use client'

import { ProductsSWRProvider } from '@/components/knowledge/reader/ArticleSWRProvider'
import { useSWRAsset } from '@/services/library'
import { useAssetStore } from '@/stores/LibraryStores'
import useSyncResource from '@/utils/hooks/useSyncResource'
import type { Asset } from '@/@types/library/Asset'
import type { ProviderProps } from '@/@types/common'

interface AssetSWRProviderProps extends ProviderProps {
    assetId: string
    /** Server-rendered first load */
    asset?: Asset
}

/** One asset → useAssetStore(assetId); products → useProductsStore */
export default function AssetSWRProvider({ assetId, asset, children }: AssetSWRProviderProps) {
    const swr = useSWRAsset(assetId, { fallbackData: asset })
    const setData = useAssetStore(assetId, (s) => s.setData)
    const setLoading = useAssetStore(assetId, (s) => s.setLoading)
    const setError = useAssetStore(assetId, (s) => s.setError)
    const setRefresh = useAssetStore(assetId, (s) => s.setRefresh)
    useSyncResource(swr, { setData, setLoading, setError, setRefresh })
    return <ProductsSWRProvider>{children}</ProductsSWRProvider>
}
