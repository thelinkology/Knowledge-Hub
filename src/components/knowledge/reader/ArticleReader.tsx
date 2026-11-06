'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import Drawer from '@/components/ui/Drawer'
import MarkdownContent from '@/components/shared/MarkdownContent'
import {
    ArticleKindTag,
    AudienceTag,
    KeywordTags,
    ProductTag,
    PublishStatusTag,
    ScopeLabel,
} from '@/components/shared/KnowledgeTags'
import ArticleToc from './ArticleToc'
import { ClockIcon, HideTocIcon, NextIcon, PrevIcon, ShowTocIcon, TocIcon } from '@/configs/icons.config'
import { getArticlePath } from '@/configs/app.config'
import { useKnowledgeTocStore } from '@/stores/KnowledgeTocStore'
import { getOutline } from '@/utils/articleValidation'
import { buildTree, flattenTree } from '@/utils/articleTree'
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
 * How an article reads (Microsoft Learn-style): the collection's table of contents on the left (a drawer
 * on small screens; it can be hidden), the article in the middle with its sub-articles ("In this section")
 * and "In this article" on the right. Previous/next follow the table of contents' reading order.
 */
export default function ArticleReader({ article, collection, products, preview }: ArticleReaderProps) {
    const outline = useMemo(() => getOutline(article.body), [article.body])
    const stats = useMemo(() => readingStats(article.body), [article.body])
    const tree = useMemo(() => buildTree(collection?.articles ?? []), [collection?.articles])
    const flat = useMemo(() => flattenTree(tree), [tree])
    const tocHidden = useKnowledgeTocStore((s) => s.hidden)
    const setTocHidden = useKnowledgeTocStore((s) => s.setHidden)
    const [drawerOpen, setDrawerOpen] = useState(false)

    // The reader's choice to hide the table of contents is loaded after mount (it's per session)
    useEffect(() => {
        void useKnowledgeTocStore.persist.rehydrate()
    }, [])

    const index = flat.findIndex((entry) => entry.item.id === article.id)
    const prev = index > 0 ? flat[index - 1].item : null
    const next = index >= 0 && index < flat.length - 1 ? flat[index + 1].item : null
    // Its sub-articles, in reading order ("In this section")
    const childEntries = flat.filter((entry) => entry.item.parentId === article.id).map((entry) => entry.item)

    const toc = collection && !preview ? collection : null
    const showToc = !!toc && !tocHidden

    return (
        <div
            className={classNames(
                'grid gap-8',
                showToc
                    ? 'lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_220px]'
                    : 'xl:grid-cols-[minmax(0,1fr)_220px]',
            )}
        >
            {showToc && (
                <aside className="no-print hidden lg:block" aria-label="Table of contents">
                    <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1 pb-4">
                        <ArticleToc
                            collection={toc}
                            currentId={article.id}
                            action={
                                <Button
                                    size="xs"
                                    variant="plain"
                                    icon={<HideTocIcon />}
                                    aria-label="Hide the table of contents"
                                    title="Hide the table of contents"
                                    onClick={() => setTocHidden(true)}
                                />
                            }
                        />
                    </div>
                </aside>
            )}

            <div className="min-w-0">
                {toc && (
                    <div className="no-print mb-4 flex flex-wrap gap-2">
                        <Button
                            size="sm"
                            icon={<TocIcon />}
                            className="lg:hidden"
                            aria-haspopup="dialog"
                            aria-expanded={drawerOpen}
                            onClick={() => setDrawerOpen(true)}
                        >
                            Table of contents
                        </Button>
                        {tocHidden && (
                            <Button
                                size="sm"
                                variant="plain"
                                icon={<ShowTocIcon />}
                                className="hidden lg:inline-flex"
                                onClick={() => setTocHidden(false)}
                            >
                                Show table of contents
                            </Button>
                        )}
                    </div>
                )}

                <article className="print-full min-w-0 max-w-3xl">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <ArticleKindTag kind={article.kind} />
                        <ProductTag productId={article.productId} products={products} />
                        <AudienceTag audience={article.audience} />
                        {article.status !== 'published' && <PublishStatusTag status={article.status} />}
                    </div>
                    <h1 className="text-3xl leading-tight md:text-4xl">{article.title || 'Untitled article'}</h1>
                    {article.summary && (
                        <p className="mt-3 text-lg text-gray-600 dark:text-gray-300">{article.summary}</p>
                    )}
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

                    {!preview && childEntries.length > 0 && (
                        <section aria-labelledby="in-this-section" className="mt-10">
                            <h2 id="in-this-section" className="text-xl">
                                In this section
                            </h2>
                            <ul className="mt-3 space-y-3">
                                {childEntries.map((child) => (
                                    <li key={child.id}>
                                        <Link
                                            href={getArticlePath(child.id)}
                                            className="font-semibold text-primary hover:underline"
                                        >
                                            {child.title}
                                        </Link>
                                        {child.status !== 'published' && (
                                            <span className="ml-2 text-xs text-warning">({child.status})</span>
                                        )}
                                        {child.summary && (
                                            <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
                                                {child.summary}
                                            </p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {article.tags.length > 0 && <KeywordTags tags={article.tags} className="mt-8" />}

                    {!preview && (prev || next) && (
                        <nav
                            aria-label="Previous and next articles"
                            className="no-print mt-10 grid gap-3 border-t border-gray-200 pt-6 sm:grid-cols-2 dark:border-gray-700"
                        >
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
                        </nav>
                    )}
                </article>
            </div>

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

            {toc && (
                <Drawer
                    title="Table of contents"
                    isOpen={drawerOpen}
                    placement="left"
                    width={320}
                    bodyClass="p-4 overflow-y-auto"
                    onClose={() => setDrawerOpen(false)}
                    onRequestClose={() => setDrawerOpen(false)}
                >
                    {drawerOpen && (
                        <ArticleToc collection={toc} currentId={article.id} onNavigate={() => setDrawerOpen(false)} />
                    )}
                </Drawer>
            )}
        </div>
    )
}
