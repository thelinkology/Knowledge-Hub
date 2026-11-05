import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ProductsSWRProvider } from '@/components/knowledge/reader/ArticleSWRProvider'
import KnowledgeBrowseClientPage from '@/components/knowledge/browse/KnowledgeBrowseClientPage'
import Loading from '@/components/shared/Loading'
import { requirePagePermission } from '@/server/actions/auth'

export const metadata: Metadata = { title: 'Knowledge' }

/** Browse and search knowledge (the query and filters live in the URL: ?q=&product=&client=&kind=&type=) */
export default async function KnowledgePage() {
    await requirePagePermission('knowledge.read')
    return (
        <ProductsSWRProvider>
            <Suspense fallback={<Loading loading message="Opening knowledge…" />}>
                <KnowledgeBrowseClientPage />
            </Suspense>
        </ProductsSWRProvider>
    )
}
