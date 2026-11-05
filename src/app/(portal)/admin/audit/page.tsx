import type { Metadata } from 'next'
import { requirePagePermission } from '@/server/actions/auth'
import { AuditSWRProvider } from '@/components/admin/audit/AuditSWRProviders'
import AuditClientPage from '@/components/admin/audit/AuditClientPage'

export const metadata: Metadata = { title: 'Audit log' }

export default async function AuditPage() {
    await requirePagePermission('audit.view')
    return (
        <AuditSWRProvider>
            <AuditClientPage />
        </AuditSWRProvider>
    )
}
