'use client'

import Button from '@/components/ui/Button'
import LinkButton from '@/components/ui/LinkButton'
import ErrorState from '@/components/shared/ErrorState'
import Loading from '@/components/shared/Loading'
import AssetReader from './AssetReader'
import { EditIcon, PrintIcon } from '@/configs/icons.config'
import { getAssetEditPath, libraryPath } from '@/configs/app.config'
import { useProductsStore } from '@/stores/AppStores'
import { useAssetStore } from '@/stores/LibraryStores'
import useSession from '@/utils/hooks/useSession'
import { usePageBreadcrumbs } from '@/utils/hooks/useBreadcrumbs'

interface AssetClientPageProps {
    assetId: string
}

/** One library asset */
export default function AssetClientPage({ assetId }: AssetClientPageProps) {
    const { can } = useSession()
    const asset = useAssetStore(assetId, (s) => s.data)
    const error = useAssetStore(assetId, (s) => s.error)
    const refresh = useAssetStore(assetId, (s) => s.refresh)
    const products = useProductsStore((s) => s.data)

    usePageBreadcrumbs([{ label: 'Library', href: libraryPath }, { label: asset?.title ?? 'Asset' }])

    if (!asset)
        return error ? (
            <ErrorState message={error} onRetry={() => void refresh()} />
        ) : (
            <Loading loading message="Opening the asset…" />
        )

    return (
        <>
            <div className="no-print mb-4 flex justify-end gap-2">
                <Button size="sm" variant="plain" icon={<PrintIcon />} onClick={() => window.print()}>
                    Print or save as PDF
                </Button>
                {can('knowledge.manage') && (
                    <LinkButton size="sm" href={getAssetEditPath(assetId)} icon={<EditIcon />}>
                        Edit
                    </LinkButton>
                )}
            </div>
            <AssetReader asset={asset} products={products} />
        </>
    )
}
