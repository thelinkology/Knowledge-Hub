'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import Loading from '@/components/shared/Loading'
import ArticleList from './ArticleList'
import BrowseFilters from './BrowseFilters'
import CollectionDialog from './CollectionDialog'
import CollectionGrid from './CollectionGrid'
import KnowledgeSearchBox from './KnowledgeSearchBox'
import KnowledgeHeroBackdrop from './KnowledgeHeroBackdrop'
import NewArticleDialog from './NewArticleDialog'
import ProductCards from './ProductCards'
import SearchResults from './SearchResults'
import {
    SHARED_CLIENT,
    getBrowseHref,
    hasNarrowingFilters,
    readBrowseFilters,
    type BrowseFilters as Filters,
} from './browseParams'
import navigationIcon, { AddIcon } from '@/configs/icons.config'
import { getCollectionPath, knowledgePath } from '@/configs/app.config'
import { useSWRArticles, useSWRCollections } from '@/services/knowledge'
import { useSWRClients } from '@/services/clients'
import { useProductsStore } from '@/stores/AppStores'
import useSession from '@/utils/hooks/useSession'
import { usePageBreadcrumbs } from '@/utils/hooks/useBreadcrumbs'
import { tryGetErrorMessage } from '@/utils/errors'
import type { KnowledgeCollection } from '@/@types/knowledge/KnowledgeCollection'
import type { Product } from '@/@types/products/Product'

const RECENT_PAGE = 10

/**
 * The knowledge browser (Microsoft Learn-style): a hero search, filters, and either ranked search results
 * (with ?q=) or "browse by product", the collections and the latest articles.
 */
export default function KnowledgeBrowseClientPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const filters = useMemo(() => readBrowseFilters(searchParams), [searchParams])
    const { can } = useSession()
    const canManage = can('knowledge.manage')
    const products = useProductsStore((s) => s.data)
    const clients = useSWRClients()
    const [newArticleOpen, setNewArticleOpen] = useState(false)
    const [newCollectionOpen, setNewCollectionOpen] = useState(false)

    usePageBreadcrumbs(
        filters.q
            ? [{ label: 'Knowledge', href: knowledgePath }, { label: `Search: ${filters.q}` }]
            : [{ label: 'Knowledge' }],
    )

    const updateFilters = useCallback(
        (patch: Partial<Filters>) => router.replace(getBrowseHref({ ...filters, ...patch }), { scroll: false }),
        [router, filters],
    )
    const search = (q: string) => router.push(getBrowseHref({ ...filters, q }))

    return (
        <>
            <section className="relative isolate mb-6 overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 px-4 py-8 sm:px-8 md:py-10 dark:border-gray-700 dark:from-teal-500/10 dark:via-gray-900 dark:to-cyan-500/10">
                <KnowledgeHeroBackdrop />
                <div className="animate-rise-in flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                        <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                            Knowledge
                        </div>
                        <h1 className="text-2xl md:text-4xl">Find what the team already knows</h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-300">
                            Articles, how-to guides and best practices, plus scripts and reference architectures from
                            the library.
                        </p>
                    </div>
                    {canManage && (
                        <div className="flex shrink-0 flex-wrap gap-2">
                            <Button size="sm" icon={<AddIcon />} onClick={() => setNewCollectionOpen(true)}>
                                New collection
                            </Button>
                            <Button
                                size="sm"
                                variant="solid"
                                icon={<AddIcon />}
                                onClick={() => setNewArticleOpen(true)}
                            >
                                New article
                            </Button>
                        </div>
                    )}
                </div>
                <KnowledgeSearchBox
                    key={filters.q}
                    defaultValue={filters.q}
                    onSearch={search}
                    className="mt-6 max-w-3xl"
                />
            </section>

            <Card className="mb-6">
                <BrowseFilters
                    filters={filters}
                    products={products}
                    clients={clients.data}
                    clientsLoading={clients.isLoading}
                    onChange={updateFilters}
                />
            </Card>

            {filters.q ? (
                <SearchResults filters={filters} products={products} clients={clients.data} onChange={updateFilters} />
            ) : (
                <BrowseSections
                    filters={filters}
                    products={products}
                    canManage={canManage}
                    onNewArticle={() => setNewArticleOpen(true)}
                    onNewCollection={() => setNewCollectionOpen(true)}
                    onClearFilters={() => updateFilters({ product: '', client: '', kind: '' })}
                />
            )}

            {newArticleOpen && <NewArticleDialog onClose={() => setNewArticleOpen(false)} />}
            {newCollectionOpen && (
                <CollectionDialog
                    onClose={() => setNewCollectionOpen(false)}
                    onSaved={(collection) => router.push(getCollectionPath(collection.id))}
                />
            )}
        </>
    )
}

interface BrowseSectionsProps {
    filters: Filters
    products: Product[] | undefined
    canManage: boolean
    onNewArticle: () => void
    onNewCollection: () => void
    onClearFilters: () => void
}

/** Without a query: browse by product, the collections and the latest articles */
function BrowseSections({
    filters,
    products,
    canManage,
    onNewArticle,
    onNewCollection,
    onClearFilters,
}: BrowseSectionsProps) {
    const filtered = hasNarrowingFilters(filters)
    const clientId = filters.client && filters.client !== SHARED_CLIENT ? filters.client : undefined
    // Collections have no article type, so they're hidden (and not loaded) while one is picked
    const collections = useSWRCollections(filters.kind ? null : { clientId, productId: filters.product || undefined })
    const articles = useSWRArticles({
        clientId,
        productId: filters.product || undefined,
        kind: filters.kind || undefined,
        scope: filters.client === SHARED_CLIENT ? 'shared' : undefined,
    })
    const [shown, setShown] = useState(RECENT_PAGE)

    const { shared, forClients } = useMemo(() => {
        const list = (collections.data ?? []).filter((c) => filters.client !== SHARED_CLIENT || !c.clientId)
        return {
            shared: list.filter((c) => !c.clientId),
            forClients: list.filter((c) => !!c.clientId),
        }
    }, [collections.data, filters.client])
    const articleList = articles.data ?? []

    return (
        <div className="space-y-8">
            {!filters.product && !filters.client && !filters.kind && products && products.some((p) => p.active) && (
                <section aria-labelledby="browse-products-heading">
                    <h2 id="browse-products-heading" className="mb-3 text-lg font-semibold">
                        Browse by product
                    </h2>
                    <ProductCards products={products} />
                </section>
            )}

            {!filters.kind && (
                <section aria-labelledby="browse-collections-heading">
                    <h2 id="browse-collections-heading" className="mb-1 text-lg font-semibold">
                        Collections
                    </h2>
                    <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
                        Articles grouped to be read in order, like a course module.
                    </p>
                    {collections.error && !collections.data ? (
                        <Card>
                            <ErrorState
                                message={tryGetErrorMessage(collections.error)}
                                onRetry={() => void collections.mutate()}
                            />
                        </Card>
                    ) : (
                        <Loading loading={collections.isLoading} message="Loading collections…">
                            {shared.length + forClients.length === 0 ? (
                                <Card>
                                    <EmptyState
                                        compact
                                        icon={navigationIcon.collection}
                                        title={filtered ? 'No collections match these filters' : 'No collections yet'}
                                        description={
                                            filtered
                                                ? 'Try another product or client, or clear the filters.'
                                                : canManage
                                                  ? 'Group related articles into a collection so people can read them in order.'
                                                  : 'Nothing has been published here yet. Use the search above, or check back soon.'
                                        }
                                        action={
                                            filtered ? (
                                                <Button size="sm" onClick={onClearFilters}>
                                                    Clear filters
                                                </Button>
                                            ) : canManage ? (
                                                <Button size="sm" icon={<AddIcon />} onClick={onNewCollection}>
                                                    New collection
                                                </Button>
                                            ) : undefined
                                        }
                                    />
                                </Card>
                            ) : (
                                <CollectionGroups shared={shared} forClients={forClients} products={products} />
                            )}
                        </Loading>
                    )}
                </section>
            )}

            <section aria-labelledby="browse-articles-heading">
                <h2 id="browse-articles-heading" className="mb-3 text-lg font-semibold">
                    {filtered ? 'Articles' : 'Recently updated articles'}
                </h2>
                <Card>
                    {articles.error && !articles.data ? (
                        <ErrorState
                            message={tryGetErrorMessage(articles.error)}
                            onRetry={() => void articles.mutate()}
                        />
                    ) : (
                        <Loading loading={articles.isLoading} message="Loading articles…">
                            {articleList.length === 0 ? (
                                <EmptyState
                                    compact
                                    icon={navigationIcon.article}
                                    title={filtered ? 'No articles match these filters' : 'No articles yet'}
                                    description={
                                        filtered
                                            ? 'Try another product, client or type, or clear the filters.'
                                            : canManage
                                              ? 'Write the first article: a how-to, a concept or a best practice the team keeps repeating.'
                                              : 'Nothing has been published yet. Check back soon.'
                                    }
                                    action={
                                        filtered ? (
                                            <Button size="sm" onClick={onClearFilters}>
                                                Clear filters
                                            </Button>
                                        ) : canManage ? (
                                            <Button size="sm" icon={<AddIcon />} onClick={onNewArticle}>
                                                New article
                                            </Button>
                                        ) : undefined
                                    }
                                />
                            ) : (
                                <>
                                    <ArticleList
                                        articles={articleList.slice(0, shown)}
                                        products={products}
                                        className={articles.isValidating ? 'opacity-70 transition-opacity' : undefined}
                                    />
                                    {articleList.length > shown && (
                                        <div className="mt-4 flex justify-center border-t border-gray-200 pt-4 dark:border-gray-700">
                                            <Button size="sm" onClick={() => setShown((n) => n + RECENT_PAGE * 2)}>
                                                Show more ({articleList.length - shown} more)
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </Loading>
                    )}
                </Card>
            </section>
        </div>
    )
}

interface CollectionGroupsProps {
    shared: KnowledgeCollection[]
    forClients: KnowledgeCollection[]
    products: Product[] | undefined
}

/** Shared collections first, then client-specific ones (headings only when both exist) */
function CollectionGroups({ shared, forClients, products }: CollectionGroupsProps) {
    if (!shared.length || !forClients.length) {
        return <CollectionGrid collections={shared.length ? shared : forClients} products={products} />
    }
    return (
        <div className="space-y-6">
            <div>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">Shared knowledge</h3>
                <CollectionGrid collections={shared} products={products} />
            </div>
            <div>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
                    For specific clients
                </h3>
                <CollectionGrid collections={forClients} products={products} />
            </div>
        </div>
    )
}
