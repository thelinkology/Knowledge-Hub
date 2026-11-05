'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import LinkButton from '@/components/ui/LinkButton'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import Loading from '@/components/shared/Loading'
import PageHeader from '@/components/shared/PageHeader'
import { ArticleKindTag, ProductTag, PublishStatusTag } from '@/components/shared/KnowledgeTags'
import CollectionDialog from '@/components/knowledge/browse/CollectionDialog'
import NewArticleDialog from '@/components/knowledge/browse/NewArticleDialog'
import navigationIcon, {
    AddIcon,
    DeleteIcon,
    EditIcon,
    MoveDownIcon,
    MoveUpIcon,
    StartIcon,
} from '@/configs/icons.config'
import { getArticlePath, getClientPath, getCollectionPath, knowledgePath } from '@/configs/app.config'
import { apiDeleteCollection, apiReorderCollection, type CollectionDetail } from '@/services/knowledge'
import { useCollectionStore, useProductsStore } from '@/stores/AppStores'
import useSession from '@/utils/hooks/useSession'
import { usePageBreadcrumbs } from '@/utils/hooks/useBreadcrumbs'
import useRecordRecentItem from '@/utils/hooks/useRecordRecentItem'
import { formatDate } from '@/utils/dates'
import classNames from '@/utils/classNames'
import type { ArticleSummary } from '@/@types/knowledge/Article'
import type { Product } from '@/@types/products/Product'

interface CollectionClientPageProps {
    collectionId: string
}

/** A collection (like a Microsoft Learn module): its summary and its articles in reading order */
export default function CollectionClientPage({ collectionId }: CollectionClientPageProps) {
    const detail = useCollectionStore(collectionId, (s) => s.data)
    const error = useCollectionStore(collectionId, (s) => s.error)
    const refresh = useCollectionStore(collectionId, (s) => s.refresh)

    usePageBreadcrumbs([
        { label: 'Knowledge', href: knowledgePath },
        { label: detail?.collection.title ?? 'Collection' },
    ])
    useRecordRecentItem(
        detail
            ? {
                  id: collectionId,
                  kind: 'collection',
                  title: detail.collection.title,
                  href: getCollectionPath(collectionId),
              }
            : null,
    )

    if (!detail)
        return error ? (
            <ErrorState message={error} onRetry={() => void refresh()} />
        ) : (
            <Loading loading message="Opening the collection…" />
        )
    return <CollectionView collectionId={collectionId} detail={detail} />
}

const articleCount = (count: number) => (count === 1 ? '1 article' : `${count} articles`)

function CollectionView({ collectionId, detail }: { collectionId: string; detail: CollectionDetail }) {
    const router = useRouter()
    const { can } = useSession()
    const canManage = can('knowledge.manage')
    const products = useProductsStore((s) => s.data)
    const setData = useCollectionStore(collectionId, (s) => s.setData)
    const refresh = useCollectionStore(collectionId, (s) => s.refresh)
    const [editing, setEditing] = useState(false)
    const [adding, setAdding] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [reordering, setReordering] = useState(false)

    const { collection, articles } = detail
    const first = articles[0]

    /** Moves an article up (-1) or down (+1); shown at once, then saved and reloaded */
    const move = async (index: number, delta: -1 | 1) => {
        const target = index + delta
        if (target < 0 || target >= articles.length) return
        const reordered = [...articles]
        ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
        setData({ ...detail, articles: reordered })
        setReordering(true)
        try {
            await apiReorderCollection(
                collectionId,
                reordered.map((a) => a.id),
            )
        } catch (e) {
            toastError('The new order couldn’t be saved.', e)
        } finally {
            await refresh()
            setReordering(false)
        }
    }

    const remove = async () => {
        setDeleting(true)
        try {
            await apiDeleteCollection(collectionId)
            toastSuccess('Collection deleted. Its articles were kept, no longer grouped.')
            router.push(knowledgePath)
        } catch (e) {
            toastError('The collection couldn’t be deleted.', e)
            setDeleting(false)
        }
    }

    return (
        <div className="mx-auto max-w-4xl">
            <PageHeader
                eyebrow={
                    <span className="inline-flex items-center gap-1.5">
                        <span aria-hidden>{navigationIcon.collection}</span> Collection
                    </span>
                }
                title={collection.title}
                description={
                    <>
                        {collection.summary && <p className="text-base">{collection.summary}</p>}
                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
                            <ProductTag productId={collection.productId} products={products} />
                            {collection.status !== 'published' && <PublishStatusTag status={collection.status} />}
                            {collection.clientId ? (
                                <Link
                                    href={getClientPath(collection.clientId)}
                                    className="text-gray-500 hover:text-primary hover:underline"
                                >
                                    Client: {collection.clientName}
                                </Link>
                            ) : (
                                <span className="text-gray-500">Shared knowledge</span>
                            )}
                            <span className="text-gray-500">{articleCount(articles.length)}</span>
                            <span className="text-gray-500">Updated {formatDate(collection.updatedAt)}</span>
                        </div>
                    </>
                }
                actions={
                    first ? (
                        <LinkButton href={getArticlePath(first.id)} variant="solid" icon={<StartIcon />}>
                            Start
                        </LinkButton>
                    ) : undefined
                }
            />

            {canManage && (
                <div className="mb-4 flex flex-wrap gap-2">
                    <Button size="sm" icon={<AddIcon />} onClick={() => setAdding(true)}>
                        Add article
                    </Button>
                    <Button size="sm" icon={<EditIcon />} onClick={() => setEditing(true)}>
                        Edit collection
                    </Button>
                    <Button size="sm" variant="plain" icon={<DeleteIcon />} onClick={() => setConfirmDelete(true)}>
                        Delete
                    </Button>
                </div>
            )}

            {canManage && collection.status !== 'published' && (
                <Alert showIcon type="info" className="mb-4">
                    {collection.status === 'archived'
                        ? 'This collection is archived: it’s hidden from browsing. Edit it to publish it again.'
                        : 'This collection is a draft, so only editors can see it. Edit it and set it to Published when it’s ready.'}
                </Alert>
            )}

            <Card bodyClass="p-0">
                {articles.length === 0 ? (
                    <EmptyState
                        icon={navigationIcon.article}
                        title="No articles in this collection yet"
                        description={
                            canManage
                                ? 'Add the first article. Articles are read in the order you set here.'
                                : 'Its articles haven’t been published yet. Check back soon, or search for what you need.'
                        }
                        action={
                            canManage ? (
                                <Button size="sm" variant="solid" icon={<AddIcon />} onClick={() => setAdding(true)}>
                                    Add article
                                </Button>
                            ) : (
                                <LinkButton size="sm" href={knowledgePath}>
                                    Browse knowledge
                                </LinkButton>
                            )
                        }
                    />
                ) : (
                    <ol
                        aria-label="Articles in reading order"
                        aria-busy={reordering}
                        className="divide-y divide-gray-200 dark:divide-gray-700"
                    >
                        {articles.map((article, index) => (
                            <CollectionArticleItem
                                key={article.id}
                                article={article}
                                index={index}
                                total={articles.length}
                                products={products}
                                canManage={canManage}
                                disabled={reordering}
                                onMove={(delta) => void move(index, delta)}
                            />
                        ))}
                    </ol>
                )}
            </Card>

            {adding && <NewArticleDialog collection={collection} onClose={() => setAdding(false)} />}
            {editing && (
                <CollectionDialog
                    collection={collection}
                    onClose={() => setEditing(false)}
                    onSaved={() => {
                        setEditing(false)
                        void refresh()
                    }}
                />
            )}
            <ConfirmDialog
                isOpen={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                type="danger"
                title="Delete this collection?"
                confirmText="Delete collection"
                onConfirm={() => void remove()}
                loading={deleting}
            >
                The collection and its reading order are deleted. This can’t be undone. Its{' '}
                {articleCount(articles.length)} are kept and can still be found, just no longer grouped.
            </ConfirmDialog>
        </div>
    )
}

interface CollectionArticleItemProps {
    article: ArticleSummary
    index: number
    total: number
    products: Product[] | undefined
    canManage: boolean
    disabled: boolean
    onMove: (delta: -1 | 1) => void
}

function CollectionArticleItem({
    article,
    index,
    total,
    products,
    canManage,
    disabled,
    onMove,
}: CollectionArticleItemProps) {
    return (
        <li className="flex gap-4 p-4 sm:p-5">
            <span
                aria-hidden
                className={classNames(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold tabular-nums',
                    article.status === 'published'
                        ? 'border-primary text-primary'
                        : 'border-dashed border-gray-300 text-gray-500 dark:border-gray-600',
                )}
            >
                {index + 1}
            </span>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href={getArticlePath(article.id)}
                        className="font-semibold text-gray-900 hover:text-primary hover:underline dark:text-gray-100"
                    >
                        <span className="sr-only">{index + 1}. </span>
                        {article.title}
                    </Link>
                    {article.status !== 'published' && <PublishStatusTag status={article.status} />}
                </div>
                {article.summary && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{article.summary}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                    <ArticleKindTag kind={article.kind} />
                    <ProductTag productId={article.productId} products={products} />
                </div>
            </div>
            {canManage && total > 1 && (
                <div className="flex shrink-0 flex-col gap-1">
                    <Button
                        size="xs"
                        variant="plain"
                        icon={<MoveUpIcon />}
                        aria-label={`Move “${article.title}” up`}
                        disabled={disabled || index === 0}
                        onClick={() => onMove(-1)}
                    />
                    <Button
                        size="xs"
                        variant="plain"
                        icon={<MoveDownIcon />}
                        aria-label={`Move “${article.title}” down`}
                        disabled={disabled || index === total - 1}
                        onClick={() => onMove(1)}
                    />
                </div>
            )}
        </li>
    )
}
