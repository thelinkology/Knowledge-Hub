import type { Metadata } from 'next'
import { ClientsSWRProvider } from '@/components/clients/ClientsSWRProviders'
import ClientsClientPage from '@/components/clients/list/ClientsClientPage'
import { requirePagePermission } from '@/server/actions/auth'

export const metadata: Metadata = { title: 'Clients' }

export default async function ClientsPage() {
    await requirePagePermission('clients.read')
    return (
        <ClientsSWRProvider>
            <ClientsClientPage />
        </ClientsSWRProvider>
    )
}
