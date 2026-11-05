'use client'

import { useSWRAssetEditor } from '@/services/library'
import { useAssetEditorStore } from '@/stores/LibraryStores'
import useSyncResource from '@/utils/hooks/useSyncResource'
import type { AssetEditorData } from '@/@types/library/AssetEditor'
import type { ProviderProps } from '@/@types/common'

interface AssetEditorSWRProviderProps extends ProviderProps {
    assetId: string
    /** Server-rendered first load */
    editor?: AssetEditorData
}

/** Asset editor data (asset, clients, products) → useAssetEditorStore(assetId) */
export default function AssetEditorSWRProvider({ assetId, editor, children }: AssetEditorSWRProviderProps) {
    // No refetch on focus: the form is the working copy; the store is refreshed explicitly after saves
    const swr = useSWRAssetEditor(assetId, { fallbackData: editor, revalidateOnFocus: false })
    const setData = useAssetEditorStore(assetId, (s) => s.setData)
    const setLoading = useAssetEditorStore(assetId, (s) => s.setLoading)
    const setError = useAssetEditorStore(assetId, (s) => s.setError)
    const setRefresh = useAssetEditorStore(assetId, (s) => s.setRefresh)
    useSyncResource(swr, { setData, setLoading, setError, setRefresh })
    return <>{children}</>
}
