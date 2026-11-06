import { describe, expect, it } from 'vitest'
import {
    MAX_ARTICLE_DEPTH,
    ancestorsOf,
    applyArrangement,
    attachToVisibleAncestors,
    buildTree,
    descendantIdsOf,
    filterTree,
    flattenTree,
    indent,
    moveDown,
    moveUp,
    outdent,
    subtreeHeight,
    toArrangement,
    validateArrangement,
    type Placement,
    type TreeItem,
} from './articleTree'

const item = (id: string, parentId: string | null = null, position = 0, title = id.toUpperCase()): TreeItem => ({
    id,
    parentId,
    position,
    title,
})

/*
 *  a
 *  ├─ a1
 *  │   └─ a1x
 *  └─ a2
 *  b
 *  c
 */
const ITEMS: TreeItem[] = [
    item('c', null, 2),
    item('a2', 'a', 1),
    item('a', null, 0),
    item('a1x', 'a1', 0),
    item('b', null, 1),
    item('a1', 'a', 0),
]

const order = (items: TreeItem[]) => flattenTree(buildTree(items)).map((e) => `${'-'.repeat(e.depth)}${e.item.id}`)

/** The tree an arrangement describes (applied to ITEMS), in reading order */
const arranged = (arrangement: Placement[] | null, items = ITEMS) => {
    expect(arrangement).not.toBeNull()
    return order(applyArrangement(items, arrangement as Placement[]))
}

/** A straight chain n0 → n1 → … of the given length */
const chain = (length: number) =>
    Array.from({ length }, (_, i) => item(`n${i}`, i === 0 ? null : `n${i - 1}`, 0, `Level ${i}`))

describe('buildTree / flattenTree', () => {
    it('nests children under parents in reading order with depths', () => {
        expect(order(ITEMS)).toEqual(['a', '-a1', '--a1x', '-a2', 'b', 'c'])
        const flat = flattenTree(buildTree(ITEMS))
        expect(flat.find((e) => e.item.id === 'a')?.childCount).toBe(2)
        expect(flat.find((e) => e.item.id === 'b')?.childCount).toBe(0)
    })

    it('orders siblings by position, then title', () => {
        const items = [item('x', null, 1, 'Zebra'), item('y', null, 1, 'Apple'), item('z', null, 0, 'Mango')]
        expect(order(items)).toEqual(['z', 'y', 'x'])
    })

    it('puts items whose parent is missing at the top level', () => {
        const items = [item('child', 'hidden-draft', 0), item('root', null, 1)]
        expect(order(items)).toEqual(['child', 'root'])
    })

    it('treats an item that is its own parent as top level', () => {
        expect(order([item('self', 'self')])).toEqual(['self'])
    })

    it('breaks a corrupt cycle instead of losing the items', () => {
        const items = [item('p', 'q', 0), item('q', 'p', 1), item('r')]
        const ids = order(items)
        expect(ids).toHaveLength(3)
        expect(ids.map((id) => id.replace(/-/g, '')).sort()).toEqual(['p', 'q', 'r'])
    })

    it('handles an empty list', () => {
        expect(buildTree([])).toEqual([])
        expect(flattenTree([])).toEqual([])
    })
})

describe('ancestorsOf / descendantIdsOf / subtreeHeight', () => {
    it('lists ancestors from the top level down', () => {
        expect(ancestorsOf(ITEMS, 'a1x').map((a) => a.id)).toEqual(['a', 'a1'])
        expect(ancestorsOf(ITEMS, 'a')).toEqual([])
        expect(ancestorsOf(ITEMS, 'unknown')).toEqual([])
    })

    it('stops at a missing parent and survives cycles', () => {
        expect(ancestorsOf([item('x', 'gone')], 'x')).toEqual([])
        expect(ancestorsOf([item('p', 'q'), item('q', 'p')], 'p').map((a) => a.id)).toEqual(['q'])
    })

    it('finds every descendant', () => {
        expect(descendantIdsOf(ITEMS, 'a').sort()).toEqual(['a1', 'a1x', 'a2'])
        expect(descendantIdsOf(ITEMS, 'a1')).toEqual(['a1x'])
        expect(descendantIdsOf(ITEMS, 'b')).toEqual([])
        expect(descendantIdsOf([item('p', 'q'), item('q', 'p')], 'p')).toEqual(['q'])
    })

    it('measures how many levels sit below an item', () => {
        expect(subtreeHeight(ITEMS, 'a')).toBe(2)
        expect(subtreeHeight(ITEMS, 'a1')).toBe(1)
        expect(subtreeHeight(ITEMS, 'c')).toBe(0)
    })
})

describe('filterTree', () => {
    it('keeps matches and their ancestors only', () => {
        const items = [
            item('a', null, 0, 'Install the gateway'),
            item('a1', 'a', 0, 'Configure refresh'),
            item('a2', 'a', 1, 'Troubleshoot refresh errors'),
            item('b', null, 1, 'Security model'),
        ]
        const ids = flattenTree(filterTree(buildTree(items), '  REFRESH ')).map((e) => e.item.id)
        expect(ids).toEqual(['a', 'a1', 'a2'])
        expect(flattenTree(filterTree(buildTree(items), 'gateway')).map((e) => e.item.id)).toEqual(['a'])
    })

    it('keeps everything for an empty filter and nothing without a match', () => {
        const tree = buildTree(ITEMS)
        expect(filterTree(tree, '   ')).toBe(tree)
        expect(filterTree(tree, 'nothing like this')).toEqual([])
    })
})

describe('attachToVisibleAncestors', () => {
    it('attaches visible items to their nearest visible ancestor', () => {
        const all = [
            item('root'),
            item('draft', 'root'),
            item('child', 'draft'),
            item('orphan', 'draft2'),
            item('draft2'),
        ]
        const visible = [item('root'), item('child', 'draft'), item('orphan', 'draft2')]
        const result = attachToVisibleAncestors(visible, all)
        expect(result.map((r) => [r.id, r.parentId])).toEqual([
            ['root', null],
            ['child', 'root'],
            ['orphan', null],
        ])
        expect(result[0]).toBe(visible[0])
    })

    it('survives cycles among hidden items', () => {
        const all = [item('h1', 'h2'), item('h2', 'h1'), item('v', 'h1')]
        expect(attachToVisibleAncestors([item('v', 'h1')], all)[0].parentId).toBeNull()
    })
})

describe('moving articles', () => {
    it('renumbers positions within each parent', () => {
        expect(toArrangement(ITEMS)).toEqual([
            { id: 'a', parentId: null, position: 0 },
            { id: 'a1', parentId: 'a', position: 0 },
            { id: 'a1x', parentId: 'a1', position: 0 },
            { id: 'a2', parentId: 'a', position: 1 },
            { id: 'b', parentId: null, position: 1 },
            { id: 'c', parentId: null, position: 2 },
        ])
    })

    it('moves up and down among siblings, carrying sub-articles', () => {
        expect(arranged(moveUp(ITEMS, 'b'))).toEqual(['b', 'a', '-a1', '--a1x', '-a2', 'c'])
        expect(arranged(moveDown(ITEMS, 'a1'))).toEqual(['a', '-a2', '-a1', '--a1x', 'b', 'c'])
        expect(arranged(moveDown(ITEMS, 'a'))).toEqual(['b', 'a', '-a1', '--a1x', '-a2', 'c'])
    })

    it('refuses to move past the ends of the sibling list', () => {
        expect(moveUp(ITEMS, 'a')).toBeNull()
        expect(moveUp(ITEMS, 'a1')).toBeNull()
        expect(moveDown(ITEMS, 'c')).toBeNull()
        expect(moveDown(ITEMS, 'a2')).toBeNull()
        expect(moveUp(ITEMS, 'unknown')).toBeNull()
    })

    it('indents under the previous sibling (as its last child)', () => {
        expect(arranged(indent(ITEMS, 'b'))).toEqual(['a', '-a1', '--a1x', '-a2', '-b', 'c'])
        expect(arranged(indent(ITEMS, 'a2'))).toEqual(['a', '-a1', '--a1x', '--a2', 'b', 'c'])
        expect(indent(ITEMS, 'a')).toBeNull()
        expect(indent(ITEMS, 'a1')).toBeNull()
    })

    it('outdents to just after the parent', () => {
        expect(arranged(outdent(ITEMS, 'a1'))).toEqual(['a', '-a2', 'a1', '-a1x', 'b', 'c'])
        expect(arranged(outdent(ITEMS, 'a1x'))).toEqual(['a', '-a1', '-a1x', '-a2', 'b', 'c'])
        expect(outdent(ITEMS, 'b')).toBeNull()
        expect(outdent(ITEMS, 'unknown')).toBeNull()
    })

    it('won’t indent deeper than the limit (counting the sub-articles that move along)', () => {
        const deepest = chain(MAX_ARTICLE_DEPTH + 1) // n0 … n5: n5 is at the limit
        const items = [...deepest, item('extra', `n${MAX_ARTICLE_DEPTH - 1}`, 1)]
        expect(indent(items, 'extra')).toBeNull()

        // n0 … n4, then top and branch (with a leaf) as siblings of n4
        const deep = [
            ...chain(MAX_ARTICLE_DEPTH),
            item('top', 'n3', 1),
            item('branch', 'n3', 2),
            item('leaf', 'branch'),
        ]
        // branch would sit at depth 5 with its leaf at 6
        expect(indent(deep, 'branch')).toBeNull()
        // top (no sub-articles) can go to depth 5, under n4
        expect(arranged(indent(deep, 'top'), deep)).toContain('-----top')
        expect(
            validateArrangement(
                toArrangement(deep),
                deep.map((i) => i.id),
            ),
        ).toBeNull()
    })

    it('produces arrangements that always validate', () => {
        const ids = ITEMS.map((i) => i.id)
        for (const id of ids) {
            for (const op of [moveUp, moveDown, indent, outdent]) {
                const result = op(ITEMS, id)
                if (result) expect(validateArrangement(result, ids)).toBeNull()
            }
        }
    })
})

describe('validateArrangement', () => {
    const ids = ['a', 'b', 'c']
    const ok: Placement[] = [
        { id: 'a', parentId: null, position: 0 },
        { id: 'b', parentId: 'a', position: 0 },
        { id: 'c', parentId: null, position: 1 },
    ]

    it('accepts a complete, acyclic arrangement', () => {
        expect(validateArrangement(ok, ids)).toBeNull()
        expect(validateArrangement([], [])).toBeNull()
    })

    it('requires every id exactly once', () => {
        expect(validateArrangement(ok.slice(0, 2), ids)).toMatch(/missing/)
        expect(validateArrangement([...ok, ok[0]], ids)).toMatch(/more than once/)
        expect(validateArrangement([...ok, { id: 'z', parentId: null, position: 3 }], ids)).toMatch(/aren’t in/)
    })

    it('refuses unknown parents, self-parents and invalid positions', () => {
        expect(validateArrangement([{ ...ok[0], parentId: 'zz' }, ok[1], ok[2]], ids)).toMatch(/parent/)
        expect(validateArrangement([{ ...ok[0], parentId: 'a' }, ok[1], ok[2]], ids)).toMatch(/own parent/)
        expect(validateArrangement([{ ...ok[0], position: -1 }, ok[1], ok[2]], ids)).toMatch(/position/)
        expect(validateArrangement([{ ...ok[0], position: 1.5 }, ok[1], ok[2]], ids)).toMatch(/position/)
    })

    it('refuses cycles', () => {
        const cycle: Placement[] = [
            { id: 'a', parentId: 'b', position: 0 },
            { id: 'b', parentId: 'a', position: 0 },
            { id: 'c', parentId: null, position: 0 },
        ]
        expect(validateArrangement(cycle, ids)).toMatch(/own sub-articles/)
        const tail: Placement[] = [
            { id: 'a', parentId: 'b', position: 0 },
            { id: 'b', parentId: 'c', position: 0 },
            { id: 'c', parentId: 'b', position: 0 },
        ]
        expect(validateArrangement(tail, ids)).toMatch(/own sub-articles/)
    })

    it('refuses anything deeper than the limit', () => {
        const atLimit = chain(MAX_ARTICLE_DEPTH + 1)
        expect(
            validateArrangement(
                toArrangement(atLimit),
                atLimit.map((i) => i.id),
            ),
        ).toBeNull()
        const tooDeep = chain(MAX_ARTICLE_DEPTH + 2)
        const placements = tooDeep.map((i) => ({ id: i.id, parentId: i.parentId, position: 0 }))
        expect(
            validateArrangement(
                placements,
                tooDeep.map((i) => i.id),
            ),
        ).toMatch(/levels deep/)
    })
})
