'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
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
import { ProductTag, PublishStatusTag } from '@/components/shared/KnowledgeTags'
import CollectionDialog from '@/components/knowledge/browse/CollectionDialog'
import NewArticleDialog from '@/components/knowledge/browse/NewArticleDialog'
import CollectionTree from './CollectionTree'
import navigationIcon, { AddIcon, DeleteIcon, EditIcon, StartIcon } from '@/configs/icons.config'
import { getArticlePath, getClientPath, knowledgePath } from '@/configs/app.config'
import { apiArrangeCollection, apiDeleteCollection, type CollectionDetail } from '@/services/knowledge'
import { useCollectionStore, useProductsStore } from '@/stores/AppStores'
import useSession from '@/utils/hooks/useSession'
import { usePageBreadcrumbs } from '@/utils/hooks/useBreadcrumbs'
import { applyArrangement, buildTree, flattenTree, type Placement } from '@/utils/articleTree'
import { formatDate } from '@/utils/dates'
import type { ArticleSummary } from '@/@types/knowledge/Article'

interface CollectionClientPageProps {
    collectionId: string
}

/** A collection (like a Microsoft Learn module): its summary and its table of contents (nested articles) */
export default function CollectionClientPage({ collectionId }: CollectionClientPageProps) {
    const detail = useCollectionStore(collectionId, (s) => s.data)
    const error = useCollectionStore(collectionId, (s) => s.error)
    const refresh = useCollectionStore(collectionId, (s) => s.refresh)

    usePageBreadcrumbs([
        { label: 'Knowledge', href: knowledgePath },
        { label: detail?.collection.title ?? 'Collection' },
    ])

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
    /** The "New article" dialog: `parent` set = adding a sub-article */
    const [adding, setAdding] = useState<{ parent: ArticleSummary | null } | null>(null)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [arranging, setArranging] = useState(false)
    const [announcement, setAnnouncement] = useState('')

    const { collection, articles } = detail
    const first = useMemo(() => flattenTree(buildTree(articles))[0]?.item, [articles])

    /** Shows a new arrangement at once, then saves it; rolls back (and says so) if it can't be saved */
    const arrange = async (arrangement: Placement[], message: string) => {
        const before = detail
        setData({ ...detail, articles: applyArrangement(articles, arrangement) })
        setArranging(true)
        try {
            await apiArrangeCollection(collectionId, arrangement)
            setAnnouncement(message)
        } catch (e) {
            setData(before)
            setAnnouncement('The change couldn’t be saved, so it was undone.')
            toastError('The table of contents couldn’t be saved, so the change was undone.', e)
        } finally {
            await refresh()
            setArranging(false)
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
                    <Button size="sm" icon={<AddIcon />} onClick={() => setAdding({ parent: null })}>
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
                                ? 'Add the first article. Articles are read in the order you set here, and can have sub-articles.'
                                : 'Its articles haven’t been published yet. Check back soon, or search for what you need.'
                        }
                        action={
                            canManage ? (
                                <Button
                                    size="sm"
                                    variant="solid"
                                    icon={<AddIcon />}
                                    onClick={() => setAdding({ parent: null })}
                                >
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
                    <CollectionTree
                        articles={articles}
                        products={products}
                        canManage={canManage}
                        busy={arranging}
                        onArrange={(arrangement, message) => void arrange(arrangement, message)}
                        onAddChild={(parent) => setAdding({ parent })}
                    />
                )}
            </Card>
            <p role="status" className="sr-only">
                {announcement}
            </p>

            {adding && (
                <NewArticleDialog
                    collection={collection}
                    parent={adding.parent ? { id: adding.parent.id, title: adding.parent.title } : null}
                    onClose={() => setAdding(null)}
                />
            )}
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
                {articleCount(articles.length)} are kept and can still be found, just no longer grouped (sub-articles
                become separate articles).
            </ConfirmDialog>
        </div>
    )
}
