import Link from 'next/link'
import { ArticleKindTag, ProductTag, PublishStatusTag, ScopeLabel } from '@/components/shared/KnowledgeTags'
import navigationIcon from '@/configs/icons.config'
import { getArticlePath } from '@/configs/app.config'
import { articleKindIcon } from '@/@types/knowledge/ArticleKindOptions'
import { formatDate } from '@/utils/dates'
import classNames from '@/utils/classNames'
import type { ArticleSummary } from '@/@types/knowledge/Article'
import type { Product } from '@/@types/products/Product'

interface ArticleListProps {
    articles: ArticleSummary[]
    products: Product[] | undefined
    /** Hide the article-type chip (e.g. on compact lists) */
    compact?: boolean
    className?: string
}

/** A calm list of articles (title, summary, type, product, scope); drafts are marked */
export default function ArticleList({ articles, products, compact, className }: ArticleListProps) {
    return (
        <ul className={classNames('divide-y divide-gray-200 dark:divide-gray-700', className)}>
            {articles.map((article) => (
                <li key={article.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                    <span
                        aria-hidden
                        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-subtle text-lg text-primary"
                    >
                        {navigationIcon[articleKindIcon[article.kind]]}
                    </span>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <Link
                                href={getArticlePath(article.id)}
                                className="font-semibold text-gray-900 hover:text-primary hover:underline dark:text-gray-100"
                            >
                                {article.title}
                            </Link>
                            {article.status !== 'published' && <PublishStatusTag status={article.status} />}
                        </div>
                        {article.summary && (
                            <p className="mt-0.5 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                                {article.summary}
                            </p>
                        )}
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                            {!compact && <ArticleKindTag kind={article.kind} />}
                            <ProductTag productId={article.productId} products={products} />
                            <ScopeLabel clientName={article.clientName} />
                            {article.collectionTitle && !compact && (
                                <span className="text-xs text-gray-500">In {article.collectionTitle}</span>
                            )}
                            <span className="text-xs text-gray-500">Updated {formatDate(article.updatedAt)}</span>
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    )
}
