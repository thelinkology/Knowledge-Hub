'use client'

import { ProductsSWRProvider } from '@/components/knowledge/reader/ArticleSWRProvider'
import { useSWRHome } from '@/services/home'
import { useHomeStore } from '@/stores/AppStores'
import useSyncResource from '@/utils/hooks/useSyncResource'
import type { HomeOverview } from '@/@types/reports/Overview'
import type { ProviderProps } from '@/@types/common'

interface HomeSWRProviderProps extends ProviderProps {
    /** Server-rendered first load */
    overview?: HomeOverview
}

/** The home overview → useHomeStore; products → useProductsStore */
export default function HomeSWRProvider({ overview, children }: HomeSWRProviderProps) {
    const swr = useSWRHome({ fallbackData: overview })
    const setData = useHomeStore((s) => s.setData)
    const setLoading = useHomeStore((s) => s.setLoading)
    const setError = useHomeStore((s) => s.setError)
    const setRefresh = useHomeStore((s) => s.setRefresh)
    useSyncResource(swr, { setData, setLoading, setError, setRefresh })
    return <ProductsSWRProvider>{children}</ProductsSWRProvider>
}
