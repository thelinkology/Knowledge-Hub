'use client'

import { useSWRUsers } from '@/services/users'
import { useUsersStore } from '@/stores/AdminStores'
import useSyncResource from '@/utils/hooks/useSyncResource'
import type { ProviderProps } from '@/@types/common'

/** Users matching the store's search / role / page → useUsersStore */
export default function UsersSWRProvider({ children }: ProviderProps) {
    const query = useUsersStore((s) => s.query)
    const swr = useSWRUsers({ q: query.q || undefined, role: query.role ?? undefined, page: query.page })
    const setData = useUsersStore((s) => s.setData)
    const setLoading = useUsersStore((s) => s.setLoading)
    const setError = useUsersStore((s) => s.setError)
    const setRefresh = useUsersStore((s) => s.setRefresh)
    useSyncResource(swr, { setData, setLoading, setError, setRefresh })
    return <>{children}</>
}
