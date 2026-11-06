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
    flattenTree,
    indent,
    moveDown,
    moveUp,
    outdent,
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
 * The collection's table of contents: articles in reading order (numbered), sub-articles nested and
 * collapsible. Editors move articles up/down among their siblings, indent them under the previous
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
    const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())
    const tree = useMemo(() => buildTree(articles), [articles])
    const numbers = useMemo(() => new Map(flattenTree(tree).map((entry, index) => [entry.item.id, index + 1])), [tree])
    const parents = useMemo(
        () =>
            tree.flatMap(function collect(node): string[] {
                return node.children.length ? [node.item.id, ...node.children.flatMap(collect)] : []
            }),
        [tree],
    )

    const elementId = (articleId: string, part: string) => `${baseId}-${articleId}-${part}`

    const toggle = (articleId: string) =>
        setCollapsed((current) => {
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
            setCollapsed((current) => {
                const next = new Set(current)
                next.delete(newParent)
                return next
            })
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
            const number = numbers.get(article.id) ?? 0
            const open = !collapsed.has(article.id)
            const groupId = elementId(article.id, 'group')
            const previous = nodes[index - 1]
            const canIndent = !!previous && previous.depth + 1 + heightOf(node) <= MAX_ARTICLE_DEPTH
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
                            'flex gap-3 p-4 sm:gap-4 sm:p-5',
                            number > 1 && 'border-t border-gray-200 dark:border-gray-700',
                        )}
                    >
                        {children.length > 0 ? (
                            <button
                                type="button"
                                aria-expanded={open}
                                aria-controls={groupId}
                                onClick={() => toggle(article.id)}
                                className="mt-1.5 -mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
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
                                'flex shrink-0 items-center justify-center rounded-full border-2 font-bold tabular-nums',
                                depth === 0 ? 'h-9 w-9 text-sm' : 'mt-0.5 h-7 w-7 text-xs',
                                article.status === 'published'
                                    ? 'border-primary text-primary'
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
                                    className="font-semibold break-words text-gray-900 hover:text-primary hover:underline dark:text-gray-100"
                                >
                                    <span className="sr-only">{number}. </span>
                                    {article.title}
                                </Link>
                                {article.status !== 'published' && <PublishStatusTag status={article.status} />}
                            </div>
                            {article.summary && (
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{article.summary}</p>
                            )}
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <ArticleKindTag kind={article.kind} />
                                <ProductTag productId={article.productId} products={products} />
                                {children.length > 0 && !open && (
                                    <span className="text-xs text-gray-500">
                                        {children.length === 1 ? '1 sub-article' : `${children.length} sub-articles`}
                                    </span>
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
                            className="ml-6 border-l border-gray-200 sm:ml-10 dark:border-gray-700"
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
                    <Button size="xs" variant="plain" onClick={() => setCollapsed(new Set())}>
                        Expand all
                    </Button>
                    <Button size="xs" variant="plain" onClick={() => setCollapsed(new Set(parents))}>
                        Collapse all
                    </Button>
                </div>
            )}
            <ol aria-label="Articles in reading order" aria-busy={busy}>
                {renderNodes(tree)}
            </ol>
        </>
    )
}
