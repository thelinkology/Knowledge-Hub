import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import AssetEditorSWRProvider from '@/components/library/editor/AssetEditorSWRProvider'
import AssetEditorClientPage from '@/components/library/editor/AssetEditorClientPage'
import { getAssetEditor } from '@/server/actions/library'
import { requirePagePermission } from '@/server/actions/auth'
import { isNotFound } from '@/server/utils/errors'
import { isUuid } from '@/utils/ids'

export const metadata: Metadata = { title: 'Edit asset' }

interface AssetEditPageProps {
    params: Promise<{ assetId: string }>
}

export default async function AssetEditPage({ params }: AssetEditPageProps) {
    await requirePagePermission('knowledge.manage')
    const { assetId } = await params
    if (!isUuid(assetId)) notFound()

    let editor
    try {
        editor = await getAssetEditor(assetId)
    } catch (error) {
        if (isNotFound(error)) notFound()
        throw error
    }

    return (
        <AssetEditorSWRProvider assetId={assetId} editor={editor}>
            <AssetEditorClientPage assetId={assetId} />
        </AssetEditorSWRProvider>
    )
}
