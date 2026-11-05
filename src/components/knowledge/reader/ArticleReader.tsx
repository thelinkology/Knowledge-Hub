'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import MarkdownContent from '@/components/shared/MarkdownContent'
import {
    ArticleKindTag,
    AudienceTag,
    KeywordTags,
    ProductTag,
    PublishStatusTag,
    ScopeLabel,
} from '@/components/shared/KnowledgeTags'
import { ClockIcon, NextIcon, PrevIcon } from '@/configs/icons.config'
import navigationIcon from '@/configs/icons.config'
import { getArticlePath, getCollectionPath } from '@/configs/app.config'
import { getOutline } from '@/utils/articleValidation'
import { readingStats } from '@/utils/media'
import { formatDate } from '@/utils/dates'
import classNames from '@/utils/classNames'
import type { Article, ArticleView } from '@/@types/knowledge/Article'
import type { Product } from '@/@types/products/Product'

interface ArticleReaderProps {
    article: Article
    collection: ArticleView['collection']
    products: Product[] | undefined
    /** The editor's preview: no navigation links */
    preview?: boolean
}

/**
 * How an article reads (Microsoft Learn-style): the collection's articles on the left, the article in
 * the middle, and "In this article" on the right. Previous/next follow the collection's order.
 */
export default function ArticleReader({ article, collection, products, preview }: ArticleReaderProps) {
    const outline = useMemo(() => getOutline(article.body), [article.body])
    const stats = useMemo(() => readingStats(article.body), [article.body])
    const siblings = collection?.articles ?? []
    const index = siblings.findIndex((a) => a.id === article.id)
    const prev = index > 0 ? siblings[index - 1] : null
    const next = index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : null

    return (
        <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_220px]">
            <nav className="no-print hidden lg:block" aria-label="In this collection">
                {collection && !preview ? (
                    <div className="sticky top-20">
                        <Link
                            href={getCollectionPath(collection.id)}
                            className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-primary dark:text-gray-100"
                        >
                            <span className="text-lg text-primary">{navigationIcon.collection}</span>
                            {collection.title}
                        </Link>
                        <ol className="space-y-0.5 border-l border-gray-200 dark:border-gray-700">
                            {siblings.map((item, i) => (
                                <li key={item.id}>
                                    <Link
                                        href={getArticlePath(item.id)}
                                        aria-current={item.id === article.id ? 'page' : undefined}
                                        className={classNames(
                                            '-ml-px block border-l-2 py-1.5 pl-3 text-sm',
                                            item.id === article.id
                                                ? 'border-primary font-semibold text-primary'
                                                : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
                                        )}
                                    >
                                        <span className="mr-1.5 tabular-nums text-gray-400">{i + 1}.</span>
                                        {item.title}
                                        {item.status !== 'published' && (
                                            <span className="ml-1 text-xs text-warning">(draft)</span>
                                        )}
                                    </Link>
                                </li>
                            ))}
                        </ol>
                    </div>
                ) : (
                    <div />
                )}
            </nav>

            <article className="print-full min-w-0 max-w-3xl">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                    <ArticleKindTag kind={article.kind} />
                    <ProductTag productId={article.productId} products={products} />
                    <AudienceTag audience={article.audience} />
                    {article.status !== 'published' && <PublishStatusTag status={article.status} />}
                </div>
                <h1 className="text-3xl leading-tight md:text-4xl">{article.title || 'Untitled article'}</h1>
                {article.summary && <p className="mt-3 text-lg text-gray-600 dark:text-gray-300">{article.summary}</p>}
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-gray-200 pb-4 text-sm text-gray-500 dark:border-gray-700">
                    <ScopeLabel clientName={article.clientName} className="text-sm" />
                    <span>Updated {formatDate(article.updatedAt)}</span>
                    {article.updatedByName && <span>by {article.updatedByName}</span>}
                    {stats.words > 0 && (
                        <span className="inline-flex items-center gap-1">
                            <ClockIcon aria-hidden /> {stats.minutes} min read
                        </span>
                    )}
                </div>

                <div className="mt-6">
                    {article.body.trim() ? (
                        <MarkdownContent headingIds>{article.body}</MarkdownContent>
                    ) : (
                        <p className="text-gray-500">Nothing written yet.</p>
                    )}
                </div>

                {article.tags.length > 0 && <KeywordTags tags={article.tags} className="mt-8" />}

                {!preview && (prev || next) && (
                    <div className="no-print mt-10 grid gap-3 border-t border-gray-200 pt-6 sm:grid-cols-2 dark:border-gray-700">
                        {prev ? (
                            <Link
                                href={getArticlePath(prev.id)}
                                className="rounded-xl border border-gray-200 p-4 hover:border-primary dark:border-gray-700"
                            >
                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                    <PrevIcon aria-hidden /> Previous
                                </span>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">{prev.title}</span>
                            </Link>
                        ) : (
                            <span />
                        )}
                        {next && (
                            <Link
                                href={getArticlePath(next.id)}
                                className="rounded-xl border border-gray-200 p-4 text-right hover:border-primary dark:border-gray-700"
                            >
                                <span className="flex items-center justify-end gap-1 text-xs text-gray-500">
                                    Next <NextIcon aria-hidden />
                                </span>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">{next.title}</span>
                            </Link>
                        )}
                    </div>
                )}
            </article>

            <aside className="no-print hidden xl:block" aria-label="In this article">
                {outline.length > 0 && (
                    <div className="article-outline sticky top-20">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                            In this article
                        </div>
                        <ul className="space-y-1 text-sm">
                            {outline.map((heading) => (
                                <li key={heading.id} className={heading.level === 3 ? 'pl-3' : undefined}>
                                    <a
                                        href={`#${heading.id}`}
                                        className="block text-gray-600 hover:text-primary dark:text-gray-400"
                                    >
                                        {heading.text}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </aside>
        </div>
    )
}
