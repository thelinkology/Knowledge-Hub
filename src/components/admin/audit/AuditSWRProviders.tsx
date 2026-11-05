'use client'

import { useSWRAuditEvents } from '@/services/users'
import { useAuditStore, useRecentAuditStore } from '@/stores/AdminStores'
import useSyncResource from '@/utils/hooks/useSyncResource'
import type { ProviderProps } from '@/@types/common'

/** The audit log page: follows the store's page / entity filter */
export function AuditSWRProvider({ children }: ProviderProps) {
    const query = useAuditStore((s) => s.query)
    const swr = useSWRAuditEvents({ page: query.page, entityType: query.entityType ?? undefined })
    const setData = useAuditStore((s) => s.setData)
    const setLoading = useAuditStore((s) => s.setLoading)
    const setError = useAuditStore((s) => s.setError)
    const setRefresh = useAuditStore((s) => s.setRefresh)
    useSyncResource(swr, { setData, setLoading, setError, setRefresh })
    return <>{children}</>
}

/** The latest events for the admin dashboard */
export function RecentAuditSWRProvider({ children }: ProviderProps) {
    const swr = useSWRAuditEvents({ page: 1 })
    const setData = useRecentAuditStore((s) => s.setData)
    const setLoading = useRecentAuditStore((s) => s.setLoading)
    const setError = useRecentAuditStore((s) => s.setError)
    const setRefresh = useRecentAuditStore((s) => s.setRefresh)
    useSyncResource(swr, { setData, setLoading, setError, setRefresh })
    return <>{children}</>
}
