'use client'

import { useSWRApiKeys } from '@/services/integrations'
import { useApiKeysStore } from '@/stores/SettingsStores'
import useSyncResource from '@/utils/hooks/useSyncResource'
import type { ProviderProps } from '@/@types/common'

/** Agent API keys → useApiKeysStore */
export default function IntegrationsSWRProvider({ children }: ProviderProps) {
    const swr = useSWRApiKeys()
    const setData = useApiKeysStore((s) => s.setData)
    const setLoading = useApiKeysStore((s) => s.setLoading)
    const setError = useApiKeysStore((s) => s.setError)
    const setRefresh = useApiKeysStore((s) => s.setRefresh)
    useSyncResource(swr, { setData, setLoading, setError, setRefresh })
    return <>{children}</>
}
