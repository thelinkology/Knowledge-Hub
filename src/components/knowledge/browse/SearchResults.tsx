'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import Button from '@/components/ui/Button'
import Segment from '@/components/ui/Segment'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import Loading from '@/components/shared/Loading'
import MarkdownContent from '@/components/shared/MarkdownContent'
import {
    ArticleKindTag,
    AssetKindTag,
    ProductTag,
    PublishStatusTag,
    ScopeLabel,
} from '@/components/shared/KnowledgeTags'
import navigationIcon, { SearchIcon } from '@/configs/icons.config'
import { useSWRSearch } from '@/services/knowledge'
import { SHARED_CLIENT, hasNarrowingFilters, type BrowseFilters, type BrowseSearchType } from './browseParams'
import { ARTICLE_KINDS, articleKindIcon, type ArticleKind } from '@/@types/knowledge/ArticleKindOptions'
import { ASSET_KINDS, assetKindIcon, type AssetKind } from '@/@types/library/Asset'
import { formatDate } from '@/utils/dates'
import { tryGetErrorMessage } from '@/utils/errors'
import classNames from '@/utils/classNames'
import type { SearchResult } from '@/@types/knowledge/Search'
import type { ClientSummary } from '@/@types/clients/Client'
import type { Product } from '@/@types/products/Product'

const SEARCH_LIMIT = 50

const TYPE_FILTERS: { value: BrowseSearchType; label: string }[] = [
    { value: 'all', label: 'Everything' },
    { value: 'article', label: 'Articles' },
    { value: 'asset', label: 'Library' },
]

const isArticleKind = (kind: string): kind is ArticleKind => (ARTICLE_KINDS as readonly string[]).includes(kind)
const isAssetKind = (kind: string): kind is AssetKind => (ASSET_KINDS as readonly string[]).includes(kind)

interface SearchResultsProps {
    filters: BrowseFilters
    products: Product[] | undefined
    clients: ClientSummary[] | undefined
    onChange: (patch: Partial<BrowseFilters>) => void
}

/** Ranked results for ?q= across articles and library assets (editors also find drafts) */
export default function SearchResults({ filters, products, clients, onChange }: SearchResultsProps) {
    const clientId = filters.client && filters.client !== SHARED_CLIENT ? filters.client : undefined
    // An article-type filter only makes sense for articles
    const type = filters.kind ? 'article' : filters.type
    const search = useSWRSearch({
        q: filters.q,
        productId: filters.product || undefined,
        clientId,
        type,
        limit: SEARCH_LIMIT,
    })

    const results = useMemo(
        () =>
            (search.data ?? []).filter(
                (r) =>
                    (filters.client !== SHARED_CLIENT || !r.clientId) &&
                    (!filters.kind || (r.type === 'article' && r.kind === filters.kind)),
            ),
        [search.data, filters.client, filters.kind],
    )
    const clientNames = useMemo(() => new Map((clients ?? []).map((c) => [c.id, c.name])), [clients])

    const narrowed = hasNarrowingFilters(filters) || type !== 'all'

    return (
        <section aria-labelledby="search-results-heading">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 id="search-results-heading" className="text-lg font-semibold" aria-live="polite">
                    {search.isLoading
                        ? `Searching for “${filters.q}”…`
                        : `${results.length}${results.length === SEARCH_LIMIT ? '+' : ''} result${results.length === 1 ? '' : 's'} for “${filters.q}”`}
                </h2>
                <Segment
                    size="sm"
                    value={type}
                    onChange={(value) => {
                        if (typeof value !== 'string' || !value) return // clicking the active filter keeps it
                        // Library assets have no article type, so leaving "Articles" clears that filter
                        onChange({ type: value as BrowseSearchType, ...(value !== 'article' ? { kind: '' } : {}) })
                    }}
                    aria-label="What to search"
                >
                    {TYPE_FILTERS.map((filter) => (
                        <Segment.Item key={filter.value} value={filter.value} type="button">
                            {filter.label}
                        </Segment.Item>
                    ))}
                </Segment>
            </div>

            {search.error && !search.data ? (
                <ErrorState
                    title="The search didn’t work"
                    message={tryGetErrorMessage(search.error)}
                    onRetry={() => void search.mutate()}
                />
            ) : (
                <Loading loading={search.isLoading} message="Searching…">
                    {results.length === 0 ? (
                        <EmptyState
                            icon={<SearchIcon />}
                            title={`Nothing found for “${filters.q}”`}
                            description={
                                narrowed
                                    ? 'Try clearing the filters, or use fewer or different words.'
                                    : 'Check the spelling, or try fewer or more general words (for example “gateway” instead of “gateway refresh error”).'
                            }
                            action={
                                narrowed ? (
                                    <Button
                                        size="sm"
                                        onClick={() => onChange({ product: '', client: '', kind: '', type: 'all' })}
                                    >
                                        Clear filters
                                    </Button>
                                ) : undefined
                            }
                        />
                    ) : (
                        <ol className={classNames('space-y-3', search.isValidating && 'opacity-70 transition-opacity')}>
                            {results.map((result) => (
                                <SearchResultItem
                                    key={`${result.type}-${result.id}`}
                                    result={result}
                                    products={products}
                                    clientName={
                                        result.clientId ? (clientNames.get(result.clientId) ?? 'a client') : null
                                    }
                                />
                            ))}
                        </ol>
                    )}
                </Loading>
            )}
        </section>
    )
}

interface SearchResultItemProps {
    result: SearchResult
    products: Product[] | undefined
    clientName: string | null
}

function SearchResultItem({ result, products, clientName }: SearchResultItemProps) {
    const icon =
        result.type === 'article'
            ? isArticleKind(result.kind)
                ? navigationIcon[articleKindIcon[result.kind]]
                : navigationIcon.article
            : isAssetKind(result.kind)
              ? navigationIcon[assetKindIcon[result.kind]]
              : navigationIcon.library
    return (
        <li className="flex gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <span
                aria-hidden
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-subtle text-lg text-primary"
            >
                {icon}
            </span>
            <div className="min-w-0 flex-1">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {result.type === 'article' ? 'Article' : 'Library'}
                </div>
                <Link
                    href={result.path}
                    className="text-lg font-semibold text-primary hover:underline focus-visible:underline"
                >
                    {result.title}
                </Link>
                {result.snippet.trim() ? (
                    <MarkdownContent
                        internalLinks
                        className="prose-sm mt-1 text-gray-600 prose-p:my-0 prose-strong:text-gray-900 dark:text-gray-300 dark:prose-strong:text-gray-50"
                    >
                        {result.snippet}
                    </MarkdownContent>
                ) : (
                    result.summary && <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{result.summary}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {result.type === 'article' && isArticleKind(result.kind) && <ArticleKindTag kind={result.kind} />}
                    {result.type === 'asset' && isAssetKind(result.kind) && <AssetKindTag kind={result.kind} />}
                    <ProductTag productId={result.productId} products={products} />
                    {result.status !== 'published' && <PublishStatusTag status={result.status} />}
                    <ScopeLabel clientName={clientName} />
                    <span className="text-xs text-gray-500">Updated {formatDate(result.updatedAt)}</span>
                </div>
            </div>
        </li>
    )
}
