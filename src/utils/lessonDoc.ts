import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import type { Blockquote, List, ListItem, PhrasingContent, Root, RootContent, Table } from 'mdast'
import { CALLOUT_MARKER, CALLOUT_TYPES, parseVideoUrl, type CalloutType } from './media'

/*
 * The visual lesson editor works on a document tree; lessons are stored as Markdown (rendered for
 * students by MarkdownContent, which never renders raw HTML). These two pure functions convert between
 * them for exactly the features the editor offers, so a lesson survives any number of round trips:
 *   text (bold, italic, strikethrough, code, links), headings, lists, quotes, callouts, code blocks,
 *   dividers, images (with captions), videos and tables.
 * Anything else in hand-written Markdown is kept as plain text rather than lost.
 */

export interface DocMark {
    type: string
    attrs?: Record<string, unknown>
}

export interface DocNode {
    type: string
    attrs?: Record<string, unknown>
    content?: DocNode[]
    marks?: DocMark[]
    text?: string
}

// ── Markdown → document ───────────────────────────────────────────────────────────────────────────

const parser = unified().use(remarkParse).use(remarkGfm)

const text = (value: string, marks: DocMark[] = []): DocNode =>
    marks.length ? { type: 'text', text: value, marks } : { type: 'text', text: value }

function inline(nodes: PhrasingContent[], marks: DocMark[] = []): DocNode[] {
    const out: DocNode[] = []
    for (const node of nodes) {
        switch (node.type) {
            case 'text':
                if (node.value) out.push(text(node.value, marks))
                break
            case 'strong':
                out.push(...inline(node.children, [...marks, { type: 'bold' }]))
                break
            case 'emphasis':
                out.push(...inline(node.children, [...marks, { type: 'italic' }]))
                break
            case 'delete':
                out.push(...inline(node.children, [...marks, { type: 'strike' }]))
                break
            case 'inlineCode':
                out.push(text(node.value, [...marks, { type: 'code' }]))
                break
            case 'break':
                out.push({ type: 'hardBreak' })
                break
            case 'link':
                out.push(...inline(node.children, [...marks, { type: 'link', attrs: { href: node.url } }]))
                break
            case 'image':
                // An image inside a sentence: keep it as its Markdown text so nothing is lost
                out.push(text(`![${node.alt ?? ''}](${node.url})`, marks))
                break
            case 'html':
                out.push(text(node.value, marks))
                break
            default:
                if ('children' in node) out.push(...inline(node.children as PhrasingContent[], marks))
                else if ('value' in node) out.push(text(String(node.value), marks))
        }
    }
    return out
}

function plainText(nodes: PhrasingContent[]): string {
    return nodes
        .map((n) =>
            'value' in n ? String(n.value) : 'children' in n ? plainText(n.children as PhrasingContent[]) : '',
        )
        .join('')
}

const paragraph = (content: DocNode[]): DocNode =>
    content.length ? { type: 'paragraph', content } : { type: 'paragraph' }

function listNode(list: List): DocNode {
    return {
        type: list.ordered ? 'orderedList' : 'bulletList',
        ...(list.ordered && list.start && list.start !== 1 ? { attrs: { start: list.start } } : {}),
        content: list.children.map((item: ListItem) => ({
            type: 'listItem',
            content: item.children.length ? blocks(item.children) : [paragraph([])],
        })),
    }
}

function quoteNode(quote: Blockquote): DocNode {
    const first = quote.children[0]
    const lead = first?.type === 'paragraph' ? first.children[0] : undefined
    const match = lead?.type === 'text' ? CALLOUT_MARKER.exec(lead.value) : null
    if (!match || first?.type !== 'paragraph' || lead?.type !== 'text') {
        return { type: 'blockquote', content: blocks(quote.children) }
    }
    const rest = lead.value.slice(match[0].length)
    const firstChildren: PhrasingContent[] = rest
        ? [{ ...lead, value: rest }, ...first.children.slice(1)]
        : first.children.slice(first.children[1]?.type === 'break' ? 2 : 1)
    const children = firstChildren.length
        ? [{ ...first, children: firstChildren }, ...quote.children.slice(1)]
        : quote.children.slice(1)
    const content = blocks(children)
    return {
        type: 'callout',
        attrs: { type: match[1].toLowerCase() },
        content: content.length ? content : [paragraph([])],
    }
}

function tableNode(table: Table): DocNode {
    return {
        type: 'table',
        content: table.children.map((row, r) => ({
            type: 'tableRow',
            content: row.children.map((cell) => ({
                type: r === 0 ? 'tableHeader' : 'tableCell',
                content: [paragraph(inline(cell.children))],
            })),
        })),
    }
}

function blocks(nodes: RootContent[]): DocNode[] {
    const out: DocNode[] = []
    for (const node of nodes) {
        switch (node.type) {
            case 'paragraph': {
                const meaningful = node.children.filter((c) => !(c.type === 'text' && !c.value.trim()))
                const only = meaningful.length === 1 ? meaningful[0] : null
                if (only?.type === 'image') {
                    const video = parseVideoUrl(only.url)
                    out.push(
                        video
                            ? { type: 'video', attrs: { src: only.url, title: only.alt ?? '' } }
                            : {
                                  type: 'image',
                                  attrs: { src: only.url, alt: only.alt ?? '', title: only.title ?? null },
                              },
                    )
                    break
                }
                if (only?.type === 'link' && parseVideoUrl(only.url)) {
                    const label = plainText(only.children).trim()
                    if (!label || label === only.url) {
                        out.push({ type: 'video', attrs: { src: only.url, title: '' } })
                        break
                    }
                }
                out.push(paragraph(inline(node.children)))
                break
            }
            case 'heading':
                out.push({
                    type: 'heading',
                    attrs: { level: Math.min(Math.max(node.depth, 1), 3) },
                    content: inline(node.children),
                })
                break
            case 'list':
                out.push(listNode(node))
                break
            case 'blockquote':
                out.push(quoteNode(node))
                break
            case 'code':
                out.push({
                    type: 'codeBlock',
                    attrs: { language: node.lang ?? null },
                    ...(node.value ? { content: [text(node.value)] } : {}),
                })
                break
            case 'thematicBreak':
                out.push({ type: 'horizontalRule' })
                break
            case 'table':
                out.push(tableNode(node))
                break
            case 'html':
                out.push(paragraph([text(node.value)]))
                break
            default:
                // Definitions, footnotes and the like: keep their text
                if ('children' in node) out.push(...blocks(node.children as RootContent[]))
        }
    }
    return out
}

export function markdownToDoc(markdown: string): DocNode {
    const tree = parser.parse(markdown) as Root
    const content = blocks(tree.children)
    return { type: 'doc', content: content.length ? content : [paragraph([])] }
}

// ── Document → Markdown ───────────────────────────────────────────────────────────────────────────

/** Escapes characters Markdown would treat as formatting */
const escapeText = (value: string) => value.replace(/([\\`*_[\]<>~|])/g, '\\$1')

/** Characters that would start a block at the beginning of a line */
const escapeLineStart = (line: string) =>
    line.replace(
        /^(\s*)(#{1,6}\s|[-+*]\s|\d+[.)]\s|>|=+\s*$|-{3,}\s*$)/,
        (_, space: string, marker: string) => `${space}${marker.replace(/^([#\-+*>=]|\d+)/, '\\$1')}`,
    )

const MARK_ORDER = ['link', 'bold', 'italic', 'strike', 'code']
const markWrap: Record<string, [string, string]> = {
    bold: ['**', '**'],
    italic: ['_', '_'],
    strike: ['~~', '~~'],
}

function serializeInline(nodes: DocNode[] = []): string {
    let out = ''
    for (const node of nodes) {
        if (node.type === 'hardBreak') {
            out += '\\\n'
            continue
        }
        if (node.type !== 'text' || !node.text) continue
        const marks = [...(node.marks ?? [])].sort((a, b) => MARK_ORDER.indexOf(a.type) - MARK_ORDER.indexOf(b.type))
        const code = marks.some((m) => m.type === 'code')
        let value = code ? codeSpan(node.text) : escapeText(node.text)
        if (!code && !value.trim()) {
            out += value
            continue
        }
        // Wrap innermost first; keep surrounding spaces outside the markers (Markdown requires it)
        const lead = code ? '' : (value.match(/^\s*/)?.[0] ?? '')
        const trail = code ? '' : (value.match(/\s*$/)?.[0] ?? '')
        value = value.slice(lead.length, value.length - trail.length || undefined)
        for (const mark of [...marks].reverse()) {
            if (mark.type === 'link') value = `[${value}](${String(mark.attrs?.href ?? '')})`
            else if (markWrap[mark.type] && value) value = `${markWrap[mark.type][0]}${value}${markWrap[mark.type][1]}`
        }
        out += lead + value + trail
    }
    return out
}

function codeSpan(value: string) {
    const longest = Math.max(0, ...(value.match(/`+/g) ?? []).map((m) => m.length))
    const fence = '`'.repeat(longest + 1)
    const pad = value.startsWith('`') || value.endsWith('`') ? ' ' : ''
    return `${fence}${pad}${value}${pad}${fence}`
}

const indent = (textBlock: string, prefix: string, first = prefix) =>
    textBlock
        .split('\n')
        .map((line, i) => (i === 0 ? first : line ? prefix : prefix.trimEnd()) + line)
        .join('\n')

function serializeBlock(node: DocNode): string {
    switch (node.type) {
        case 'paragraph':
            return serializeInline(node.content)
                .split('\n')
                .map((line, i, all) => (i === 0 || all[i - 1].endsWith('\\') ? escapeLineStart(line) : line))
                .join('\n')
        case 'heading':
            return `${'#'.repeat(Number(node.attrs?.level ?? 2))} ${serializeInline(node.content)}`
        case 'bulletList':
        case 'orderedList': {
            const start = Number(node.attrs?.start ?? 1)
            return (node.content ?? [])
                .map((item, i) => {
                    const marker = node.type === 'orderedList' ? `${start + i}. ` : '- '
                    const body = serializeBlocks(item.content ?? [], true)
                    return indent(body, ' '.repeat(marker.length), marker)
                })
                .join('\n')
        }
        case 'blockquote':
            return indent(serializeBlocks(node.content ?? []), '> ')
        case 'callout': {
            const type = CALLOUT_TYPES.includes(node.attrs?.type as CalloutType) ? String(node.attrs?.type) : 'note'
            return indent(`[!${type.toUpperCase()}]\n${serializeBlocks(node.content ?? [])}`, '> ')
        }
        case 'codeBlock': {
            const value = (node.content ?? []).map((c) => c.text ?? '').join('')
            const fence = '`'.repeat(Math.max(3, ...(value.match(/`{3,}/g) ?? []).map((m) => m.length + 1)))
            return `${fence}${node.attrs?.language ?? ''}\n${value}\n${fence}`
        }
        case 'horizontalRule':
            return '---'
        case 'image': {
            const title = node.attrs?.title ? ` "${String(node.attrs.title).replace(/"/g, '“')}"` : ''
            return `![${String(node.attrs?.alt ?? '').replace(/[[\]]/g, '')}](${String(node.attrs?.src ?? '')}${title})`
        }
        case 'video':
            return `![${String(node.attrs?.title ?? '').replace(/[[\]]/g, '') || 'Video'}](${String(node.attrs?.src ?? '')})`
        case 'table': {
            const rows = (node.content ?? []).map((row) =>
                (row.content ?? []).map(
                    (cell) =>
                        (cell.content ?? [])
                            .map((p) => serializeInline(p.content))
                            .join(' ')
                            .replace(/\n/g, ' ')
                            .trim() || ' ',
                ),
            )
            if (!rows.length) return ''
            const width = Math.max(...rows.map((r) => r.length))
            const line = (cells: string[]) =>
                `| ${Array.from({ length: width }, (_, i) => cells[i] ?? ' ').join(' | ')} |`
            return [line(rows[0]), line(Array(width).fill('---')), ...rows.slice(1).map(line)].join('\n')
        }
        default:
            return node.content ? serializeBlocks(node.content) : ''
    }
}

/** Blocks separated by blank lines; inside a list item a nested list follows directly (a tight list) */
function serializeBlocks(nodes: DocNode[], inListItem = false): string {
    const parts = nodes.map((node) => ({ node, text: serializeBlock(node) }))
    return parts
        .filter((part, i) => part.text !== '' || (i > 0 && i < parts.length - 1))
        .map((part, i) => {
            if (i === 0) return part.text
            const nested = inListItem && (part.node.type === 'bulletList' || part.node.type === 'orderedList')
            return (nested ? '\n' : '\n\n') + part.text
        })
        .join('')
        .replace(/\n{3,}/g, '\n\n')
}

export function docToMarkdown(doc: DocNode): string {
    const markdown = serializeBlocks(doc.content ?? []).trim()
    return markdown ? `${markdown}\n` : ''
}
