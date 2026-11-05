'use client'

import { ProductsSWRProvider } from '@/components/knowledge/reader/ArticleSWRProvider'
import { useSWRClient, useSWRClients, useSWRPeople } from '@/services/clients'
import { useClientsStore, useClientStore } from '@/stores/AppStores'
import { useClientsQueryStore, usePeopleStore } from '@/stores/LibraryStores'
import useSession from '@/utils/hooks/useSession'
import useSyncResource from '@/utils/hooks/useSyncResource'
import type { Client } from '@/@types/clients/Client'
import type { ProviderProps } from '@/@types/common'

/** Clients matching the list's search / status → useClientsStore; products and people for tags and pickers */
export function ClientsSWRProvider({ children }: ProviderProps) {
    const query = useClientsQueryStore((s) => s.query)
    const swr = useSWRClients({ q: query.q || undefined, status: query.status ?? undefined })
    const setData = useClientsStore((s) => s.setData)
    const setLoading = useClientsStore((s) => s.setLoading)
    const setError = useClientsStore((s) => s.setError)
    const setRefresh = useClientsStore((s) => s.setRefresh)
    useSyncResource(swr, { setData, setLoading, setError, setRefresh })
    return (
        <ProductsSWRProvider>
            <PeopleSWRProvider>{children}</PeopleSWRProvider>
        </ProductsSWRProvider>
    )
}

interface ClientSWRProviderProps extends ProviderProps {
    clientId: string
    /** Server-rendered first load */
    client?: Client
}

/** One client → useClientStore(clientId); products and people for tags and pickers */
export function ClientSWRProvider({ clientId, client, children }: ClientSWRProviderProps) {
    const swr = useSWRClient(clientId, { fallbackData: client })
    const setData = useClientStore(clientId, (s) => s.setData)
    const setLoading = useClientStore(clientId, (s) => s.setLoading)
    const setError = useClientStore(clientId, (s) => s.setError)
    const setRefresh = useClientStore(clientId, (s) => s.setRefresh)
    useSyncResource(swr, { setData, setLoading, setError, setRefresh })
    return (
        <ProductsSWRProvider>
            <PeopleSWRProvider>{children}</PeopleSWRProvider>
        </ProductsSWRProvider>
    )
}

/** Possible owners (editors and admins) → usePeopleStore. Only loaded for people who can edit clients. */
function PeopleSWRProvider({ children }: ProviderProps) {
    const { can } = useSession()
    const swr = useSWRPeople(can('clients.manage'))
    const setData = usePeopleStore((s) => s.setData)
    const setLoading = usePeopleStore((s) => s.setLoading)
    const setError = usePeopleStore((s) => s.setError)
    const setRefresh = usePeopleStore((s) => s.setRefresh)
    useSyncResource(swr, { setData, setLoading, setError, setRefresh })
    return <>{children}</>
}
