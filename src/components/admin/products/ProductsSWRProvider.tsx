'use client'

import { useSWRProducts } from '@/services/clients'
import { useAdminProductsStore } from '@/stores/SettingsStores'
import useSyncResource from '@/utils/hooks/useSyncResource'
import type { ProviderProps } from '@/@types/common'

/** Every product (inactive ones too) → useAdminProductsStore */
export default function ProductsSWRProvider({ children }: ProviderProps) {
    const swr = useSWRProducts()
    const setData = useAdminProductsStore((s) => s.setData)
    const setLoading = useAdminProductsStore((s) => s.setLoading)
    const setError = useAdminProductsStore((s) => s.setError)
    const setRefresh = useAdminProductsStore((s) => s.setRefresh)
    useSyncResource(swr, { setData, setLoading, setError, setRefresh })
    return <>{children}</>
}
