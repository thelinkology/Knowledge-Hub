'use client'

import Link from 'next/link'
import LinkButton from '@/components/ui/LinkButton'
import MarkdownContent from '@/components/shared/MarkdownContent'
import { AssetKindTag, KeywordTags, ProductTag, PublishStatusTag, ScopeLabel } from '@/components/shared/KnowledgeTags'
import CodeSnippet from './CodeSnippet'
import { ExternalLinkIcon } from '@/configs/icons.config'
import { getClientPath } from '@/configs/app.config'
import { assetKindLabel, type Asset } from '@/@types/library/Asset'
import { publishStatusLabel } from '@/@types/shared/PublishStatusOptions'
import { formatDate } from '@/utils/dates'
import type { Product } from '@/@types/products/Product'
import type { ReactNode } from 'react'

interface AssetReaderProps {
    asset: Asset
    products: Product[] | undefined
    /** The editor's preview: no navigation links */
    preview?: boolean
}

/** Where the link goes ("github.com"), so people know before they open it */
const linkHost = (url: string) => {
    try {
        return new URL(url).host
    } catch {
        return null
    }
}

/** How a library asset reads: what it is, where it lives, how to use it, and its code */
export default function AssetReader({ asset, products, preview }: AssetReaderProps) {
    const host = asset.url ? linkHost(asset.url) : null
    const product = asset.productId ? products?.find((p) => p.id === asset.productId) : undefined
    const hasCode = asset.code.trim().length > 0

    return (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
            <article className="print-full min-w-0 max-w-3xl">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                    <AssetKindTag kind={asset.kind} />
                    <ProductTag productId={asset.productId} products={products} />
                    {asset.status !== 'published' && <PublishStatusTag status={asset.status} />}
                </div>
                <h1 className="text-3xl leading-tight md:text-4xl">{asset.title || 'Untitled asset'}</h1>
                {asset.summary && <p className="mt-3 text-lg text-gray-600 dark:text-gray-300">{asset.summary}</p>}
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-gray-200 pb-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    <ScopeLabel clientName={asset.clientName} className="text-sm" />
                    <span>Updated {formatDate(asset.updatedAt)}</span>
                    {asset.updatedByName && <span>by {asset.updatedByName}</span>}
                </div>

                {asset.url && (
                    <div className="no-print mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                        <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Where it lives</div>
                            <div className="truncate text-sm text-gray-500 dark:text-gray-400">{host ?? asset.url}</div>
                        </div>
                        <LinkButton
                            size="sm"
                            variant="solid"
                            href={asset.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            icon={<ExternalLinkIcon />}
                            iconAlignment="end"
                        >
                            Open link
                            <span className="sr-only"> (opens in a new tab)</span>
                        </LinkButton>
                    </div>
                )}

                <section className="mt-8" aria-labelledby="asset-how-to">
                    <h2 id="asset-how-to" className="mb-3 text-xl">
                        How to use it
                    </h2>
                    {asset.body.trim() ? (
                        <MarkdownContent internalLinks={!preview}>{asset.body}</MarkdownContent>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400">No instructions written yet.</p>
                    )}
                </section>

                {hasCode && (
                    <section className="mt-8" aria-labelledby="asset-code">
                        <h2 id="asset-code" className="mb-3 text-xl">
                            Code
                        </h2>
                        <CodeSnippet code={asset.code} language={asset.codeLanguage} />
                    </section>
                )}

                {asset.tags.length > 0 && <KeywordTags tags={asset.tags} className="mt-8" />}
            </article>

            <aside aria-label="Asset details">
                <div className="sticky top-20 rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
                    <h2 className="mb-3 text-sm font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                        Details
                    </h2>
                    <dl className="space-y-3 text-sm">
                        <Detail label="Type">{assetKindLabel[asset.kind]}</Detail>
                        <Detail label="Product">{product?.name ?? 'Any product'}</Detail>
                        <Detail label="Applies to">
                            {asset.clientId && asset.clientName && !preview ? (
                                <Link
                                    href={getClientPath(asset.clientId, 'library')}
                                    className="text-primary hover:underline"
                                >
                                    {asset.clientName}
                                </Link>
                            ) : (
                                (asset.clientName ?? 'All clients (shared)')
                            )}
                        </Detail>
                        {asset.status !== 'published' && (
                            <Detail label="Status">{publishStatusLabel[asset.status]}</Detail>
                        )}
                        <Detail label="Added">
                            {formatDate(asset.createdAt)}
                            {asset.createdByName && ` by ${asset.createdByName}`}
                        </Detail>
                        <Detail label="Includes">
                            {[asset.url && 'Link', asset.body.trim() && 'Instructions', hasCode && 'Code']
                                .filter(Boolean)
                                .join(', ') || 'Nothing yet'}
                        </Detail>
                    </dl>
                </div>
            </aside>
        </div>
    )
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
            <dd className="font-medium text-gray-900 dark:text-gray-100">{children}</dd>
        </div>
    )
}
