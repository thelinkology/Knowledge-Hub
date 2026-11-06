import type { Element, ElementContent, Root, RootContent } from 'hast'
import { headingId } from '@/utils/articleValidation'

const textOf = (node: ElementContent): string =>
    node.type === 'text' ? node.value : node.type === 'element' ? node.children.map(textOf).join('') : ''

/**
 * Gives h2/h3 headings the ids the “In this article” outline links to (getOutline computes the same ones):
 * `headingId(text)`, with `-1`, `-2`… for repeats. Done on the document tree, once per render, so the ids
 * don't depend on how often React renders the heading components (Strict Mode renders them twice).
 */
export default function rehypeHeadingIds() {
    return (tree: Root) => {
        const used = new Map<string, number>()
        const visit = (node: Root | RootContent) => {
            if (node.type === 'element' && (node.tagName === 'h2' || node.tagName === 'h3')) {
                const base = headingId((node as Element).children.map(textOf).join(''))
                const n = used.get(base) ?? 0
                used.set(base, n + 1)
                node.properties = { ...node.properties, id: n ? `${base}-${n}` : base }
                return
            }
            if ('children' in node) node.children.forEach((child) => visit(child))
        }
        visit(tree)
    }
}
