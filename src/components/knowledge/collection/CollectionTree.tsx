'use client'

import Link from 'next/link'
import { useId, useMemo, useState, type ReactNode } from 'react'
import Button from '@/components/ui/Button'
import { ArticleKindTag, ProductTag, PublishStatusTag } from '@/components/shared/KnowledgeTags'
import { AddSubArticleIcon, IndentIcon, MoveDownIcon, MoveUpIcon, NextIcon, OutdentIcon } from '@/configs/icons.config'
import { getArticlePath } from '@/configs/app.config'
import {
    MAX_ARTICLE_DEPTH,
    buildTree,
    indent,
    moveDown,
    moveUp,
    outdent,
    outlineNumbers,
    type Placement,
    type TreeNode,
} from '@/utils/articleTree'
import classNames from '@/utils/classNames'
import type { ArticleSummary } from '@/@types/knowledge/Article'
import type { Product } from '@/@types/products/Product'

export type TreeAction = 'up' | 'down' | 'indent' | 'outdent'

interface CollectionTreeProps {
    articles: ArticleSummary[]
    products: Product[] | undefined
    canManage: boolean
    /** A change is being saved: further moves wait */
    busy: boolean
    /** Applies (optimistically) and saves a new arrangement */
    onArrange: (arrangement: Placement[], message: string) => void
    onAddChild: (parent: ArticleSummary) => void
}

const OPERATIONS: Record<TreeAction, (items: ArticleSummary[], id: string) => Placement[] | null> = {
    up: moveUp,
    down: moveDown,
    indent,
    outdent,
}

const heightOf = (node: TreeNode<ArticleSummary>): number =>
    node.children.length ? 1 + Math.max(...node.children.map(heightOf)) : 0

/**
 * The collection's table of contents: articles in reading order, numbered like an outline (1, 1.1, 1.2,
 * 2…), sub-articles in a panel under their parent, collapsed until opened. Editors move articles up/down among their siblings, indent them under the previous
 * sibling or outdent them a level, and add sub-articles. Every button is keyboard accessible and focus
 * follows the moved article.
 */
export default function CollectionTree({
    articles,
    products,
    canManage,
    busy,
    onArrange,
    onAddChild,
}: CollectionTreeProps) {
    const baseId = useId()
    /** Articles whose sub-articles are shown (everything starts collapsed) */
    const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
    const tree = useMemo(() => buildTree(articles), [articles])
    const numbers = useMemo(() => outlineNumbers(tree), [tree])
    const parents = useMemo(
        () =>
            tree.flatMap(function collect(node): string[] {
                return node.children.length ? [node.item.id, ...node.children.flatMap(collect)] : []
            }),
        [tree],
    )

    const elementId = (articleId: string, part: string) => `${baseId}-${articleId}-${part}`

    const toggle = (articleId: string) =>
        setExpanded((current) => {
            const next = new Set(current)
            if (next.has(articleId)) next.delete(articleId)
            else next.add(articleId)
            return next
        })

    const run = (action: TreeAction, node: TreeNode<ArticleSummary>, siblings: TreeNode<ArticleSummary>[]) => {
        // One change at a time (the buttons stay enabled so keyboard focus isn't lost while saving)
        if (busy) return
        const arrangement = OPERATIONS[action](articles, node.item.id)
        if (!arrangement) return
        const title = node.item.title
        const index = siblings.indexOf(node)
        const message =
            action === 'up'
                ? `Moved “${title}” up.`
                : action === 'down'
                  ? `Moved “${title}” down.`
                  : action === 'indent'
                    ? `“${title}” is now a sub-article of “${siblings[index - 1]?.item.title}”.`
                    : `Moved “${title}” up a level.`
        // A new parent must be open to show where the article went
        if (action === 'indent' && siblings[index - 1]) {
            const newParent = siblings[index - 1].item.id
            setExpanded((current) => new Set(current).add(newParent))
        }
        onArrange(arrangement, message)
        // Keep keyboard focus on the moved article (it may have been re-rendered elsewhere)
        requestAnimationFrame(() => {
            const button = document.getElementById(elementId(node.item.id, action)) as HTMLButtonElement | null
            const target =
                button && !button.disabled ? button : document.getElementById(elementId(node.item.id, 'link'))
            target?.focus()
        })
    }

    const renderNodes = (nodes: TreeNode<ArticleSummary>[]) =>
        nodes.map((node, index) => {
            const { item: article, children, depth } = node
            const number = numbers.get(article.id) ?? ''
            const open = expanded.has(article.id)
            const groupId = elementId(article.id, 'group')
            const previous = nodes[index - 1]
            const canIndent = !!previous && previous.depth + 1 + heightOf(node) <= MAX_ARTICLE_DEPTH
            const top = depth === 0
            const published = article.status === 'published'
            const actionButton = (action: TreeAction, label: string, icon: ReactNode, enabled: boolean) => (
                <Button
                    id={elementId(article.id, action)}
                    size="xs"
                    variant="plain"
                    icon={icon}
                    aria-label={`${label}: “${article.title}”`}
                    title={label}
                    disabled={!enabled}
                    onClick={() => run(action, node, nodes)}
                />
            )
            return (
                <li key={article.id}>
                    <div
                        className={classNames(
                            'flex items-start',
                            top ? 'gap-3 p-4 sm:gap-4 sm:p-5' : 'gap-3 px-3 py-3',
                        )}
                    >
                        {children.length > 0 ? (
                            <button
                                type="button"
                                aria-expanded={open}
                                aria-controls={groupId}
                                onClick={() => toggle(article.id)}
                                className={classNames(
                                    '-mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-200/70 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100',
                                    top ? 'mt-1.5' : 'mt-0.5',
                                )}
                            >
                                <NextIcon
                                    aria-hidden
                                    className={classNames('transition-transform motion-reduce:transition-none', {
                                        'rotate-90': open,
                                    })}
                                />
                                <span className="sr-only">
                                    {open ? 'Collapse' : 'Expand'} {article.title}
                                </span>
                            </button>
                        ) : (
                            <span aria-hidden className="-mr-1 w-6 shrink-0" />
                        )}
                        <span
                            aria-hidden
                            className={classNames(
                                'flex shrink-0 items-center justify-center font-bold tabular-nums',
                                top
                                    ? 'h-9 w-9 rounded-full border-2 text-sm'
                                    : 'mt-0.5 h-6 min-w-9 rounded-md border px-1.5 text-xs',
                                published
                                    ? top
                                        ? 'border-primary text-primary'
                                        : 'border-primary/40 bg-white text-primary dark:bg-gray-900'
                                    : 'border-dashed border-gray-300 text-gray-500 dark:border-gray-600',
                            )}
                        >
                            {number}
                        </span>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <Link
                                    id={elementId(article.id, 'link')}
                                    href={getArticlePath(article.id)}
                                    className={classNames(
                                        'font-semibold break-words text-gray-900 hover:text-primary hover:underline dark:text-gray-100',
                                        !top && 'text-sm',
                                    )}
                                >
                                    <span className="sr-only">{number}. </span>
                                    {article.title}
                                </Link>
                                {!published && <PublishStatusTag status={article.status} />}
                            </div>
                            {article.summary && (
                                <p
                                    className={classNames(
                                        'mt-1 text-sm text-gray-600 dark:text-gray-400',
                                        top ? 'line-clamp-3' : 'line-clamp-2',
                                    )}
                                >
                                    {article.summary}
                                </p>
                            )}
                            <div className="mt-2 flex flex-wrap items-center gap-2 empty:hidden">
                                {top && <ArticleKindTag kind={article.kind} />}
                                {top && <ProductTag productId={article.productId} products={products} />}
                                {children.length > 0 && (
                                    <button
                                        type="button"
                                        tabIndex={-1}
                                        aria-hidden
                                        onClick={() => toggle(article.id)}
                                        className="text-xs font-semibold text-gray-500 hover:text-primary"
                                    >
                                        {children.length === 1 ? '1 sub-article' : `${children.length} sub-articles`}
                                    </button>
                                )}
                            </div>
                        </div>
                        {canManage && (
                            <div
                                role="group"
                                aria-label={`Arrange “${article.title}”`}
                                className="flex w-[5.75rem] shrink-0 flex-wrap content-start justify-end gap-0.5 sm:w-auto sm:flex-nowrap"
                            >
                                {actionButton('up', 'Move up', <MoveUpIcon />, index > 0)}
                                {actionButton('down', 'Move down', <MoveDownIcon />, index < nodes.length - 1)}
                                {actionButton('outdent', 'Outdent (up a level)', <OutdentIcon />, depth > 0)}
                                {actionButton('indent', 'Indent (under the article above)', <IndentIcon />, canIndent)}
                                <Button
                                    size="xs"
                                    variant="plain"
                                    icon={<AddSubArticleIcon />}
                                    aria-label={`Add a sub-article under “${article.title}”`}
                                    title={
                                        depth < MAX_ARTICLE_DEPTH
                                            ? 'Add sub-article'
                                            : 'This level can’t have sub-articles'
                                    }
                                    disabled={depth >= MAX_ARTICLE_DEPTH}
                                    onClick={() => onAddChild(article)}
                                />
                            </div>
                        )}
                    </div>
                    {children.length > 0 && (
                        <ol
                            id={groupId}
                            hidden={!open}
                            aria-label={`Sub-articles of “${article.title}”`}
                            className={classNames(
                                'divide-y divide-gray-200 dark:divide-gray-700',
                                top
                                    ? 'mx-4 mb-4 rounded-xl border border-gray-200 bg-gray-50 sm:mr-5 sm:ml-[5.5rem] dark:border-gray-700 dark:bg-gray-800/40'
                                    : 'ml-9 border-t border-l border-gray-200 dark:border-gray-700',
                            )}
                        >
                            {renderNodes(children)}
                        </ol>
                    )}
                </li>
            )
        })

    return (
        <>
            {parents.length > 0 && (
                <div className="no-print flex flex-wrap justify-end gap-1 border-b border-gray-200 px-4 py-2 dark:border-gray-700">
                    <Button size="xs" variant="plain" onClick={() => setExpanded(new Set(parents))}>
                        Expand all
                    </Button>
                    <Button size="xs" variant="plain" onClick={() => setExpanded(new Set())}>
                        Collapse all
                    </Button>
                </div>
            )}
            <ol
                aria-label="Articles in reading order"
                aria-busy={busy}
                className="divide-y divide-gray-200 dark:divide-gray-700"
            >
                {renderNodes(tree)}
            </ol>
        </>
    )
}
