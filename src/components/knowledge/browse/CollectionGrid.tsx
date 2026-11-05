import Link from 'next/link'
import { ProductTag, PublishStatusTag, ScopeLabel } from '@/components/shared/KnowledgeTags'
import navigationIcon from '@/configs/icons.config'
import { getCollectionPath } from '@/configs/app.config'
import classNames from '@/utils/classNames'
import type { KnowledgeCollection } from '@/@types/knowledge/KnowledgeCollection'
import type { Product } from '@/@types/products/Product'

interface CollectionGridProps {
    collections: KnowledgeCollection[]
    products: Product[] | undefined
    className?: string
}

const articleCount = (count: number) => (count === 1 ? '1 article' : `${count} articles`)

/** Collection cards (like Microsoft Learn modules): title, summary, product, scope and size */
export default function CollectionGrid({ collections, products, className }: CollectionGridProps) {
    return (
        <ul className={classNames('grid gap-4 sm:grid-cols-2 xl:grid-cols-3', className)}>
            {collections.map((collection) => (
                <li key={collection.id}>
                    <Link
                        href={getCollectionPath(collection.id)}
                        className="group flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-primary dark:border-gray-700 dark:bg-gray-800"
                    >
                        <span className="flex items-start gap-3">
                            <span
                                aria-hidden
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-subtle text-xl text-primary"
                            >
                                {navigationIcon.collection}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block font-semibold text-gray-900 group-hover:text-primary dark:text-gray-100">
                                    {collection.title}
                                </span>
                                <ScopeLabel clientName={collection.clientName} />
                            </span>
                        </span>
                        {collection.summary && (
                            <span className="mt-3 line-clamp-3 text-sm text-gray-600 dark:text-gray-400">
                                {collection.summary}
                            </span>
                        )}
                        <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                            <span className="text-xs font-semibold text-gray-500">
                                {articleCount(collection.articleCount)}
                            </span>
                            <ProductTag productId={collection.productId} products={products} />
                            {collection.status !== 'published' && <PublishStatusTag status={collection.status} />}
                        </div>
                    </Link>
                </li>
            ))}
        </ul>
    )
}
