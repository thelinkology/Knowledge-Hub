import type { Metadata } from 'next'
import { requirePagePermission } from '@/server/actions/auth'
import IntegrationsSWRProvider from '@/components/admin/integrations/IntegrationsSWRProvider'
import IntegrationsClientPage from '@/components/admin/integrations/IntegrationsClientPage'

export const metadata: Metadata = { title: 'Copilot integration' }

export default async function IntegrationsPage() {
    await requirePagePermission('settings.manage')
    return (
        <IntegrationsSWRProvider>
            <IntegrationsClientPage />
        </IntegrationsSWRProvider>
    )
}
