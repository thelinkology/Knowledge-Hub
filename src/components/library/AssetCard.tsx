import Link from 'next/link'
import { ProductTag, PublishStatusTag, ScopeLabel } from '@/components/shared/KnowledgeTags'
import navigationIcon, { CodeIcon, DiagramIcon, LinkIcon } from '@/configs/icons.config'
import { getAssetPath } from '@/configs/app.config'
import { assetKindIcon, assetKindLabel, type AssetSummary } from '@/@types/library/Asset'
import { formatDate } from '@/utils/dates'
import { formatDiagramSummary } from '@/utils/diagram'
import classNames from '@/utils/classNames'
import type { Product } from '@/@types/products/Product'

interface AssetCardProps {
    asset: AssetSummary
    products: Product[] | undefined
    /** Show "Shared knowledge" / the client's name (off on a client's own page) */
    showScope?: boolean
    className?: string
}

/** A library asset in a grid: kind, title, summary, product, scope and what it includes */
export default function AssetCard({ asset, products, showScope = true, className }: AssetCardProps) {
    return (
        <Link
            href={getAssetPath(asset.id)}
            className={classNames(
                'group flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-primary hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:border-gray-700 dark:bg-gray-800 dark:hover:border-primary',
                className,
            )}
        >
            <div className="flex items-start gap-3">
                <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-subtle text-xl text-primary"
                    aria-hidden
                >
                    {navigationIcon[assetKindIcon[asset.kind]]}
                </span>
                <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                        {assetKindLabel[asset.kind]}
                    </div>
                    <h3 className="mt-0.5 line-clamp-2 text-base font-semibold text-gray-900 group-hover:text-primary dark:text-gray-100">
                        {asset.title}
                    </h3>
                </div>
                {asset.status !== 'published' && <PublishStatusTag status={asset.status} className="shrink-0" />}
            </div>
            <p className="mt-2 line-clamp-3 text-sm text-gray-600 dark:text-gray-300">
                {asset.summary || <span className="text-gray-400 italic dark:text-gray-500">No summary yet.</span>}
            </p>
            <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 pt-4 text-xs text-gray-500 dark:text-gray-400">
                <ProductTag productId={asset.productId} products={products} />
                {asset.kind === 'reference_architecture' && asset.diagramSummary && (
                    <span className="inline-flex items-center gap-1">
                        <DiagramIcon aria-hidden /> {formatDiagramSummary(asset.diagramSummary)}
                    </span>
                )}
                {asset.hasCode && (
                    <span className="inline-flex items-center gap-1">
                        <CodeIcon aria-hidden /> Includes code
                    </span>
                )}
                {asset.url && (
                    <span className="inline-flex items-center gap-1">
                        <LinkIcon aria-hidden /> Link
                    </span>
                )}
                {showScope && <ScopeLabel clientName={asset.clientName} />}
                <span className="ml-auto whitespace-nowrap">Updated {formatDate(asset.updatedAt)}</span>
            </div>
        </Link>
    )
}
