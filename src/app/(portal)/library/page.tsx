import type { Metadata } from 'next'
import { ProductsSWRProvider } from '@/components/knowledge/reader/ArticleSWRProvider'
import { ClientOptionsSWRProvider, LibrarySWRProvider } from '@/components/library/LibrarySWRProviders'
import LibraryClientPage from '@/components/library/browse/LibraryClientPage'
import { requirePagePermission } from '@/server/actions/auth'

export const metadata: Metadata = { title: 'Library' }

export default async function LibraryPage() {
    await requirePagePermission('library.read')
    return (
        <ProductsSWRProvider>
            <ClientOptionsSWRProvider>
                <LibrarySWRProvider>
                    <LibraryClientPage />
                </LibrarySWRProvider>
            </ClientOptionsSWRProvider>
        </ProductsSWRProvider>
    )
}
