'use client'

import Link from 'next/link'
import { useId, useMemo, useState, type ReactNode } from 'react'
import Input from '@/components/ui/Input'
import navigationIcon, { NextIcon, SearchIcon } from '@/configs/icons.config'
import { getArticlePath, getCollectionPath } from '@/configs/app.config'
import { ancestorsOf, buildTree, filterTree, type TreeNode } from '@/utils/articleTree'
import classNames from '@/utils/classNames'
import type { ArticleTreeEntry, ArticleView } from '@/@types/knowledge/Article'

interface ArticleTocProps {
    collection: NonNullable<ArticleView['collection']>
    currentId: string
    /** Called when an article link is followed (closes the mobile drawer) */
    onNavigate?: () => void
    /** Shown next to the collection title (e.g. the « button that hides the panel) */
    action?: ReactNode
    className?: string
}

/**
 * The collection's table of contents (Microsoft Learn-style): the collection title, a "Find by title"
 * filter and the nested articles. The current article is highlighted and its ancestors start expanded.
 */
export default function ArticleToc({ collection, currentId, onNavigate, action, className }: ArticleTocProps) {
    const baseId = useId()
    const [filter, setFilter] = useState('')
    /** Expand/collapse choices the reader made (otherwise: the current article's branch is open) */
    const [toggled, setToggled] = useState<Record<string, boolean>>({})

    const tree = useMemo(() => buildTree(collection.articles), [collection.articles])
    const shown = useMemo(() => filterTree(tree, filter), [tree, filter])
    const openByDefault = useMemo(
        () => new Set([currentId, ...ancestorsOf(collection.articles, currentId).map((a) => a.id)]),
        [collection.articles, currentId],
    )
    const filtering = filter.trim().length > 0

    // While filtering, every match's branch starts open
    const isExpanded = (id: string) => toggled[id] ?? (filtering || openByDefault.has(id))
    const toggle = (id: string) => setToggled((current) => ({ ...current, [id]: !isExpanded(id) }))

    const renderNodes = (nodes: TreeNode<ArticleTreeEntry>[]) =>
        nodes.map((node) => {
            const { item, children } = node
            const current = item.id === currentId
            const expanded = isExpanded(item.id)
            const groupId = `${baseId}-group-${item.id}`
            return (
                <li key={item.id}>
                    <div
                        className={classNames(
                            '-ml-px flex items-start border-l-2',
                            current
                                ? 'border-primary bg-primary-subtle'
                                : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600',
                        )}
                    >
                        {children.length > 0 ? (
                            <button
                                type="button"
                                aria-expanded={expanded}
                                aria-controls={groupId}
                                onClick={() => toggle(item.id)}
                                className="mt-1 ml-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-primary dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                            >
                                <NextIcon
                                    aria-hidden
                                    className={classNames('transition-transform motion-reduce:transition-none', {
                                        'rotate-90': expanded,
                                    })}
                                />
                                <span className="sr-only">
                                    {expanded ? 'Collapse' : 'Expand'} {item.title}
                                </span>
                            </button>
                        ) : (
                            <span aria-hidden className="ml-0.5 w-6 shrink-0" />
                        )}
                        <Link
                            href={getArticlePath(item.id)}
                            aria-current={current ? 'page' : undefined}
                            onClick={onNavigate}
                            className={classNames(
                                'min-w-0 flex-1 py-1.5 pr-2 text-sm leading-snug break-words',
                                current
                                    ? 'font-semibold text-primary'
                                    : 'text-gray-700 hover:text-gray-900 hover:underline dark:text-gray-300 dark:hover:text-gray-100',
                            )}
                        >
                            {item.title}
                            {item.status !== 'published' && (
                                <span className="ml-1 text-xs font-normal text-warning">({item.status})</span>
                            )}
                        </Link>
                    </div>
                    {children.length > 0 && (
                        <ul
                            id={groupId}
                            hidden={!expanded}
                            className="ml-3.5 border-l border-gray-200 dark:border-gray-700"
                        >
                            {renderNodes(children)}
                        </ul>
                    )}
                </li>
            )
        })

    return (
        <div className={className}>
            <div className="mb-3 flex items-start gap-2">
                <Link
                    href={getCollectionPath(collection.id)}
                    onClick={onNavigate}
                    className="flex min-w-0 flex-1 items-start gap-2 text-sm font-semibold text-gray-900 hover:text-primary hover:underline dark:text-gray-100"
                >
                    <span aria-hidden className="mt-0.5 text-base text-primary">
                        {navigationIcon.collection}
                    </span>
                    <span className="min-w-0 break-words">{collection.title}</span>
                </Link>
                {action}
            </div>
            <label htmlFor={`${baseId}-filter`} className="sr-only">
                Find by title
            </label>
            <Input
                id={`${baseId}-filter`}
                size="sm"
                type="search"
                autoComplete="off"
                prefix={<SearchIcon className="text-base text-gray-400" />}
                placeholder="Find by title"
                value={filter}
                onChange={(e) => {
                    setFilter(e.target.value)
                    setToggled({})
                }}
                className="mb-3"
            />
            <nav aria-label={`${collection.title}: table of contents`}>
                {shown.length > 0 ? (
                    <ul>{renderNodes(shown)}</ul>
                ) : (
                    <p className="px-2 py-1.5 text-sm text-gray-500" role="status">
                        {filtering ? `No article titles match “${filter.trim()}”.` : 'No articles yet.'}
                    </p>
                )}
            </nav>
        </div>
    )
}
