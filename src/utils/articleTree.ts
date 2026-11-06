/*
 * Sub-articles: the articles of a collection form a tree (a Microsoft Learn-style table of contents).
 * Pure functions shared by the browser (reader TOC, collection page, editor) and the server (which
 * validates every arrangement before applying it; the database trigger check_article_parent is the
 * last line of defence).
 *
 * Rules: siblings are ordered by position, then title. An item whose parent isn't in the list (a
 * draft parent hidden from viewers, a deleted parent) is shown at the top level. Depth = the number
 * of ancestors; the top level is 0 and the deepest allowed is MAX_ARTICLE_DEPTH (as in the trigger).
 */

/** The deepest a sub-article may sit (number of ancestors), as enforced by public.check_article_parent */
export const MAX_ARTICLE_DEPTH = 5

/** A parent link */
export interface TreeLink {
    id: string
    parentId: string | null
}

/** What the tree needs from an article */
export interface TreeItem extends TreeLink {
    position: number
    title: string
}

/** Where an article sits: what the server stores (PUT /api/collections/[id]/tree) */
export interface Placement {
    id: string
    parentId: string | null
    position: number
}

export interface TreeNode<T extends TreeItem> {
    item: T
    depth: number
    children: TreeNode<T>[]
}

export interface FlatTreeEntry<T extends TreeItem> {
    item: T
    depth: number
    childCount: number
}

const ROOT = ''

const bySiblingOrder = (a: TreeItem, b: TreeItem) =>
    a.position - b.position || a.title.localeCompare(b.title) || a.id.localeCompare(b.id)

/** Each item's parent when that parent is in the list (orphans → null) */
function effectiveParents(items: TreeLink[]): Map<string, string | null> {
    const ids = new Set(items.map((item) => item.id))
    return new Map(
        items.map((item) => [
            item.id,
            item.parentId && item.parentId !== item.id && ids.has(item.parentId) ? item.parentId : null,
        ]),
    )
}

/**
 * The tree: top-level items and their children, each level ordered by position then title. Items whose
 * parent is missing become top-level; a (corrupt) cycle is broken at its first item.
 */
export function buildTree<T extends TreeItem>(items: T[]): TreeNode<T>[] {
    const parents = effectiveParents(items)
    const childrenOf = new Map<string, T[]>()
    for (const item of [...items].sort(bySiblingOrder)) {
        const key = parents.get(item.id) ?? ROOT
        const list = childrenOf.get(key)
        if (list) list.push(item)
        else childrenOf.set(key, [item])
    }
    const visited = new Set<string>()
    const grow = (list: T[], depth: number): TreeNode<T>[] =>
        list
            .filter((item) => !visited.has(item.id))
            .map((item) => {
                visited.add(item.id)
                return { item, depth, children: grow(childrenOf.get(item.id) ?? [], depth + 1) }
            })
    const roots = grow(childrenOf.get(ROOT) ?? [], 0)
    // Anything not reached sits in a cycle: start from its first item
    for (const item of [...items].sort(bySiblingOrder)) {
        if (!visited.has(item.id)) roots.push(...grow([item], 0))
    }
    return roots
}

/** The tree in reading order (depth first), with each item's depth and number of children */
export function flattenTree<T extends TreeItem>(tree: TreeNode<T>[]): FlatTreeEntry<T>[] {
    const out: FlatTreeEntry<T>[] = []
    const walk = (nodes: TreeNode<T>[]) => {
        for (const node of nodes) {
            out.push({ item: node.item, depth: node.depth, childCount: node.children.length })
            walk(node.children)
        }
    }
    walk(tree)
    return out
}

/** Outline numbers (“1”, “1.1”, “1.2.1”, “2”…): each item's position among its siblings, below its parent's */
export function outlineNumbers<T extends TreeItem>(tree: TreeNode<T>[]): Map<string, string> {
    const numbers = new Map<string, string>()
    const walk = (nodes: TreeNode<T>[], prefix: string) =>
        nodes.forEach((node, index) => {
            const number = `${prefix}${index + 1}`
            numbers.set(node.item.id, number)
            walk(node.children, `${number}.`)
        })
    walk(tree, '')
    return numbers
}

/** The item's ancestors, top level first (empty for a top-level or unknown item) */
export function ancestorsOf<T extends TreeLink>(items: T[], id: string): T[] {
    const parents = effectiveParents(items)
    const byId = new Map(items.map((item) => [item.id, item]))
    const chain: T[] = []
    const seen = new Set([id])
    let cursor = parents.get(id) ?? null
    while (cursor && !seen.has(cursor)) {
        seen.add(cursor)
        chain.unshift(byId.get(cursor) as T)
        cursor = parents.get(cursor) ?? null
    }
    return chain
}

/** Ids of every item below this one (children, grandchildren …), in no particular order */
export function descendantIdsOf(items: TreeLink[], id: string): string[] {
    const parents = effectiveParents(items)
    const childrenOf = new Map<string, string[]>()
    for (const [child, parent] of parents) {
        if (parent) childrenOf.set(parent, [...(childrenOf.get(parent) ?? []), child])
    }
    const found = new Set<string>()
    const queue = [...(childrenOf.get(id) ?? [])]
    while (queue.length) {
        const next = queue.shift() as string
        if (next === id || found.has(next)) continue
        found.add(next)
        queue.push(...(childrenOf.get(next) ?? []))
    }
    return [...found]
}

/** How many levels sit below the item (0 for an item without children) */
export function subtreeHeight(items: TreeLink[], id: string): number {
    const parents = effectiveParents(items)
    const descendants = descendantIdsOf(items, id)
    let height = 0
    for (const descendant of descendants) {
        let levels = 0
        let cursor: string | null = descendant
        while (cursor && cursor !== id && levels <= items.length) {
            levels++
            cursor = parents.get(cursor) ?? null
        }
        height = Math.max(height, levels)
    }
    return height
}

/**
 * Keeps the items whose title contains `text` (case-insensitive) and their ancestors, so a match is
 * always shown in context. An empty filter keeps everything.
 */
export function filterTree<T extends TreeItem>(tree: TreeNode<T>[], text: string): TreeNode<T>[] {
    const needle = text.trim().toLocaleLowerCase()
    if (!needle) return tree
    const keep = (nodes: TreeNode<T>[]): TreeNode<T>[] =>
        nodes.flatMap((node) => {
            const children = keep(node.children)
            return node.item.title.toLocaleLowerCase().includes(needle) || children.length
                ? [{ ...node, children }]
                : []
        })
    return keep(tree)
}

/**
 * Hidden articles (drafts for viewers, archived ones) break the chain: each visible item is attached to
 * its nearest visible ancestor (or the top level). `all` holds every article's parent link.
 */
export function attachToVisibleAncestors<T extends TreeLink>(visible: T[], all: TreeLink[]): T[] {
    const visibleIds = new Set(visible.map((item) => item.id))
    const parentOf = new Map(all.map((item) => [item.id, item.parentId]))
    return visible.map((item) => {
        let cursor = item.parentId
        const seen = new Set([item.id])
        while (cursor && !visibleIds.has(cursor) && !seen.has(cursor)) {
            seen.add(cursor)
            cursor = parentOf.get(cursor) ?? null
        }
        const parentId = cursor && visibleIds.has(cursor) && cursor !== item.id ? cursor : null
        return parentId === item.parentId ? item : { ...item, parentId }
    })
}

// ── Rearranging (collection page) ─────────────────────────────────────────────────────────────────

/** The ordered children of every parent ('' = top level), as the tree shows them */
function siblingLists(items: TreeItem[]): Map<string, string[]> {
    const lists = new Map<string, string[]>([[ROOT, []]])
    const walk = (nodes: TreeNode<TreeItem>[], key: string) => {
        lists.set(
            key,
            nodes.map((node) => node.item.id),
        )
        for (const node of nodes) walk(node.children, node.item.id)
    }
    walk(buildTree(items), ROOT)
    return lists
}

function parentKeys(lists: Map<string, string[]>): Map<string, string> {
    const parentKey = new Map<string, string>()
    for (const [key, ids] of lists) for (const id of ids) parentKey.set(id, key)
    return parentKey
}

/** Every item with its parent and its index among its siblings (reading order) */
function toPlacements(lists: Map<string, string[]>): Placement[] {
    const out: Placement[] = []
    const walk = (key: string) => {
        for (const [position, id] of (lists.get(key) ?? []).entries()) {
            out.push({ id, parentId: key === ROOT ? null : key, position })
            walk(id)
        }
    }
    walk(ROOT)
    return out
}

function depthIn(parentKey: Map<string, string>, id: string): number {
    let depth = 0
    let cursor = parentKey.get(id) ?? ROOT
    while (cursor !== ROOT && depth <= parentKey.size) {
        depth++
        cursor = parentKey.get(cursor) ?? ROOT
    }
    return depth
}

function heightIn(lists: Map<string, string[]>, id: string): number {
    const children = lists.get(id) ?? []
    return children.length ? 1 + Math.max(...children.map((child) => heightIn(lists, child))) : 0
}

/** The arrangement as it stands (positions renumbered 0, 1, 2 … within each parent) */
export function toArrangement(items: TreeItem[]): Placement[] {
    return toPlacements(siblingLists(items))
}

function swapWithSibling(items: TreeItem[], id: string, delta: -1 | 1): Placement[] | null {
    const lists = siblingLists(items)
    const key = parentKeys(lists).get(id)
    if (key === undefined) return null
    const list = lists.get(key) as string[]
    const index = list.indexOf(id)
    const target = index + delta
    if (target < 0 || target >= list.length) return null
    ;[list[index], list[target]] = [list[target], list[index]]
    return toPlacements(lists)
}

/** Moves the item before its previous sibling; null when it's already first */
export const moveUp = (items: TreeItem[], id: string) => swapWithSibling(items, id, -1)

/** Moves the item after its next sibling; null when it's already last */
export const moveDown = (items: TreeItem[], id: string) => swapWithSibling(items, id, 1)

/**
 * Makes the item (with its sub-articles) the last child of its previous sibling; null when there is no
 * previous sibling or the subtree would go deeper than MAX_ARTICLE_DEPTH.
 */
export function indent(items: TreeItem[], id: string): Placement[] | null {
    const lists = siblingLists(items)
    const keys = parentKeys(lists)
    const key = keys.get(id)
    if (key === undefined) return null
    const list = lists.get(key) as string[]
    const index = list.indexOf(id)
    if (index <= 0) return null
    const newParent = list[index - 1]
    if (depthIn(keys, newParent) + 1 + heightIn(lists, id) > MAX_ARTICLE_DEPTH) return null
    list.splice(index, 1)
    lists.set(newParent, [...(lists.get(newParent) ?? []), id])
    return toPlacements(lists)
}

/** Makes the item (with its sub-articles) the next sibling of its parent; null at the top level */
export function outdent(items: TreeItem[], id: string): Placement[] | null {
    const lists = siblingLists(items)
    const keys = parentKeys(lists)
    const key = keys.get(id)
    if (key === undefined || key === ROOT) return null
    const grandKey = keys.get(key) ?? ROOT
    const list = lists.get(key) as string[]
    list.splice(list.indexOf(id), 1)
    const grandList = lists.get(grandKey) as string[]
    grandList.splice(grandList.indexOf(key) + 1, 0, id)
    return toPlacements(lists)
}

/** Applies an arrangement to the items (new parent and position), keeping everything else */
export function applyArrangement<T extends TreeItem>(items: T[], arrangement: Placement[]): T[] {
    const placed = new Map(arrangement.map((p) => [p.id, p]))
    return items.map((item) => {
        const p = placed.get(item.id)
        return p ? { ...item, parentId: p.parentId, position: p.position } : item
    })
}

/**
 * Checks a complete arrangement of `ids`: every id exactly once, parents among them, no cycles, nothing
 * deeper than MAX_ARTICLE_DEPTH. Returns what's wrong (a sentence for the editor), or null when it's fine.
 */
export function validateArrangement(arrangement: Placement[], ids: string[]): string | null {
    const expected = new Set(ids)
    const parentOf = new Map<string, string | null>()
    for (const p of arrangement) {
        if (parentOf.has(p.id)) return 'An article appears more than once in the new order.'
        if (!expected.has(p.id)) return 'Some of those articles aren’t in this collection.'
        if (!Number.isInteger(p.position) || p.position < 0) return 'An article has an invalid position.'
        parentOf.set(p.id, p.parentId)
    }
    if (parentOf.size !== expected.size) return 'Some articles are missing from the new order. Reload and try again.'
    for (const p of arrangement) {
        if (p.parentId === null) continue
        if (p.parentId === p.id) return 'An article can’t be its own parent.'
        if (!parentOf.has(p.parentId)) return 'A parent article isn’t in this collection.'
    }
    for (const p of arrangement) {
        let depth = 0
        let cursor = p.parentId
        const seen = new Set([p.id])
        while (cursor) {
            if (seen.has(cursor)) return 'An article can’t sit under one of its own sub-articles.'
            seen.add(cursor)
            depth++
            if (depth > MAX_ARTICLE_DEPTH) {
                return `Sub-articles can only be nested ${MAX_ARTICLE_DEPTH} levels deep.`
            }
            cursor = parentOf.get(cursor) ?? null
        }
    }
    return null
}
