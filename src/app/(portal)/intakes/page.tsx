import type { Metadata } from 'next'
import IntakesClientPage from '@/components/intakes/IntakesClientPage'
import { ProductsSWRProvider } from '@/components/knowledge/reader/ArticleSWRProvider'
import { getIntakes } from '@/server/actions/intake'
import { requirePagePermission } from '@/server/actions/auth'

export const metadata: Metadata = { title: 'Discovery intakes' }

export default async function IntakesPage() {
    await requirePagePermission('requirements.manage')
    const intakes = await getIntakes()
    return (
        <ProductsSWRProvider>
            <IntakesClientPage initialData={intakes} />
        </ProductsSWRProvider>
    )
}
