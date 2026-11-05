import type { Blockquote, Root, RootContent } from 'mdast'
import { CALLOUT_MARKER } from '@/utils/media'

/**
 * Turns `> [!TIP]` (also NOTE, IMPORTANT, WARNING) quotes into callouts: strips the marker and tags the
 * quote with `data-callout`, which MarkdownContent renders as a styled box.
 */
export default function remarkCallouts() {
    return (tree: Root) => {
        const visit = (node: Root | RootContent) => {
            if (node.type === 'blockquote') tagCallout(node)
            if ('children' in node) node.children.forEach((child) => visit(child as RootContent))
        }
        visit(tree)
    }
}

function tagCallout(quote: Blockquote) {
    const first = quote.children[0]
    if (first?.type !== 'paragraph') return
    const text = first.children[0]
    if (text?.type !== 'text') return
    const match = CALLOUT_MARKER.exec(text.value)
    if (!match) return
    text.value = text.value.slice(match[0].length)
    // Nothing else on the marker's line: drop the empty paragraph start (a line break)
    if (!text.value && first.children[1]?.type === 'break') first.children.splice(0, 2)
    else if (!text.value) first.children.shift()
    if (!first.children.length) quote.children.shift()
    quote.data = { ...quote.data, hProperties: { dataCallout: match[1].toLowerCase() } }
}
