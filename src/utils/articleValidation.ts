import { readingStats } from './media'

export interface PublishIssue {
    field: 'title' | 'summary' | 'body'
    message: string
}

/** Images written as ![](…) — no description for screen readers */
const IMAGE_WITHOUT_ALT = /!\[\s*\]\(/

/**
 * What must be true before an article (or library asset) is published. Shown as the editor's checklist
 * and enforced again on the server. The summary matters twice: it's what search results and Copilot
 * Studio show first.
 */
export function getPublishIssues({ title, summary, body }: { title: string; summary: string; body: string }) {
    const issues: PublishIssue[] = []
    if (title.trim().length < 2) issues.push({ field: 'title', message: 'Give it a title.' })
    if (!summary.trim()) {
        issues.push({ field: 'summary', message: 'Write a one- or two-sentence summary (search and Copilot show it).' })
    }
    if (readingStats(body).words < 10)
        issues.push({ field: 'body', message: 'Write the content (at least a few sentences).' })
    if (IMAGE_WITHOUT_ALT.test(body)) issues.push({ field: 'body', message: 'Describe every image (alt text).' })
    return issues
}

/** A Heading 2 / Heading 3 of a document and the id MarkdownContent gives it */
export interface OutlineHeading {
    level: 2 | 3
    text: string
    id: string
}

/** Headings in a Markdown document, for the "In this article" outline */
export function getOutline(markdown: string): OutlineHeading[] {
    const outline: OutlineHeading[] = []
    const used = new Map<string, number>()
    let inFence = false
    for (const line of markdown.split(/\r?\n/)) {
        if (/^\s*(```|~~~)/.test(line)) inFence = !inFence
        if (inFence) continue
        const match = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line)
        if (!match) continue
        const text = match[2].replace(/[*_`~]|\[([^\]]*)\]\([^)]*\)/g, '$1').trim()
        if (!text) continue
        const base = headingId(text)
        const n = used.get(base) ?? 0
        used.set(base, n + 1)
        outline.push({ level: match[1].length as 2 | 3, text, id: n ? `${base}-${n}` : base })
    }
    return outline
}

/** The id a heading gets in the rendered article (MarkdownContent uses the same function) */
export const headingId = (text: string) =>
    text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 80) || 'section'
