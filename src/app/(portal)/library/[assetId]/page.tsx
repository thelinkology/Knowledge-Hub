import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import AssetSWRProvider from '@/components/library/reader/AssetSWRProvider'
import AssetClientPage from '@/components/library/reader/AssetClientPage'
import { getAsset } from '@/server/actions/library'
import { getDiagramComponents } from '@/server/actions/diagramComponents'
import { requirePagePermission } from '@/server/actions/auth'
import { isNotFound } from '@/server/utils/errors'
import { isUuid } from '@/utils/ids'

export const metadata: Metadata = { title: 'Library asset' }

interface AssetPageProps {
    params: Promise<{ assetId: string }>
}

export default async function AssetPage({ params }: AssetPageProps) {
    const user = await requirePagePermission('library.read')
    const { assetId } = await params
    if (!isUuid(assetId)) notFound()

    let asset
    try {
        asset = await getAsset(user, assetId)
    } catch (error) {
        if (isNotFound(error)) notFound()
        throw error
    }

    const diagramComponents = asset.kind === 'reference_architecture' ? await getDiagramComponents() : undefined

    return (
        <AssetSWRProvider assetId={assetId} asset={asset} diagramComponents={diagramComponents}>
            <AssetClientPage assetId={assetId} />
        </AssetSWRProvider>
    )
}
