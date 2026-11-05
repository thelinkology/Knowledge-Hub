import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import CollectionSWRProvider from '@/components/knowledge/collection/CollectionSWRProvider'
import CollectionClientPage from '@/components/knowledge/collection/CollectionClientPage'
import { getCollection } from '@/server/actions/knowledge'
import { requirePagePermission } from '@/server/actions/auth'
import { isNotFound } from '@/server/utils/errors'
import { isUuid } from '@/utils/ids'

export const metadata: Metadata = { title: 'Collection' }

interface CollectionPageProps {
    params: Promise<{ collectionId: string }>
}

export default async function CollectionPage({ params }: CollectionPageProps) {
    const user = await requirePagePermission('knowledge.read')
    const { collectionId } = await params
    if (!isUuid(collectionId)) notFound()

    let detail
    try {
        detail = await getCollection(user, collectionId)
    } catch (error) {
        if (isNotFound(error)) notFound()
        throw error
    }

    return (
        <CollectionSWRProvider collectionId={collectionId} detail={detail}>
            <CollectionClientPage collectionId={collectionId} />
        </CollectionSWRProvider>
    )
}
