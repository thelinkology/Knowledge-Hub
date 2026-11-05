import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ClientSWRProvider } from '@/components/clients/ClientsSWRProviders'
import ClientClientPage from '@/components/clients/detail/ClientClientPage'
import { getClient } from '@/server/actions/clients'
import { requirePagePermission } from '@/server/actions/auth'
import { isNotFound } from '@/server/utils/errors'
import { isUuid } from '@/utils/ids'

export const metadata: Metadata = { title: 'Client' }

interface ClientPageProps {
    params: Promise<{ clientId: string }>
}

/** One client; `?tab=` (overview | knowledge | library | intakes | brds) selects the tab */
export default async function ClientPage({ params }: ClientPageProps) {
    const user = await requirePagePermission('knowledge.read')
    const { clientId } = await params
    if (!isUuid(clientId)) notFound()

    let client
    try {
        client = await getClient(clientId, user)
    } catch (error) {
        if (isNotFound(error)) notFound()
        throw error
    }

    return (
        <ClientSWRProvider clientId={clientId} client={client}>
            <ClientClientPage clientId={clientId} />
        </ClientSWRProvider>
    )
}
