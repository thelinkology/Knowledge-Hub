import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import AssetSWRProvider from '@/components/library/reader/AssetSWRProvider'
import AssetClientPage from '@/components/library/reader/AssetClientPage'
import { getAsset } from '@/server/actions/library'
import { requirePagePermission } from '@/server/actions/auth'
import { isNotFound } from '@/server/utils/errors'
import { isUuid } from '@/utils/ids'

export const metadata: Metadata = { title: 'Library asset' }

interface AssetPageProps {
    params: Promise<{ assetId: string }>
}

export default async function AssetPage({ params }: AssetPageProps) {
    const user = await requirePagePermission('knowledge.read')
    const { assetId } = await params
    if (!isUuid(assetId)) notFound()

    let asset
    try {
        asset = await getAsset(user, assetId)
    } catch (error) {
        if (isNotFound(error)) notFound()
        throw error
    }

    return (
        <AssetSWRProvider assetId={assetId} asset={asset}>
            <AssetClientPage assetId={assetId} />
        </AssetSWRProvider>
    )
}
