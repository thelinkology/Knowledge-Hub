import type { Metadata } from 'next'
import BrdsClientPage from '@/components/brds/BrdsClientPage'
import { requirePagePermission } from '@/server/actions/auth'

export const metadata: Metadata = { title: 'BRDs' }

export default async function BrdsPage() {
    await requirePagePermission('requirements.manage')
    return <BrdsClientPage />
}
