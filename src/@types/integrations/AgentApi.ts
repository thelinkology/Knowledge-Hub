import { z } from 'zod'

/*
 * The read-only agent API (/api/v1, Copilot Studio). Responses are plain JSON with Markdown text; dates are
 * ISO strings; `url` is an absolute link to the page in Knowledge Hub that an agent can cite.
 */

/** The authenticated key: its id and, for a client-scoped key, the one client it may read */
export interface AgentContext {
    keyId: string
    clientId: string | null
}

export interface AgentClientRef {
    id: string
    slug: string
    name: string
}

export interface AgentProductRef {
    id: string
    code: string
    name: string
}

export interface AgentSearchResult {
    id: string
    type: 'article' | 'asset'
    title: string
    summary: string
    /** The matching passage, matched words in **bold** */
    snippet: string
    kind: string
    /** null = shared knowledge (applies to every client) */
    client: AgentClientRef | null
    product: AgentProductRef | null
    updatedAt: string
    url: string
}

export interface AgentArticle {
    id: string
    title: string
    summary: string
    kind: string
    audience: string
    client: AgentClientRef | null
    product: AgentProductRef | null
    tags: string[]
    updatedAt: string
    url: string
    /** The article body (Markdown) */
    content: string
}

export interface AgentAsset {
    id: string
    title: string
    summary: string
    kind: string
    client: AgentClientRef | null
    product: AgentProductRef | null
    tags: string[]
    updatedAt: string
    url: string
    /** How to use it (Markdown) */
    content: string
    /** An optional snippet (script, DAX, JSON flow …) */
    code: string
    codeLanguage: string
    /** Where the asset lives (repository, SharePoint …), or '' */
    link: string
}

export interface AgentClient {
    id: string
    slug: string
    name: string
    industry: string
    summary: string
    status: string
}

/** Empty query parameters (`client=`) count as not given: connectors often send every parameter */
const optionalText = (max: number) =>
    z.preprocess(
        (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
        z.string().trim().max(max).optional(),
    )

/** GET /api/v1/knowledge/search */
export const AgentSearchQuerySchema = z.object({
    q: z.string().trim().min(1, 'Give a search query in `q`.').max(200),
    /** A client slug or id */
    client: optionalText(80),
    /** A product code or id */
    product: optionalText(60),
    type: z.preprocess(
        (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
        z.enum(['all', 'article', 'asset']).default('all'),
    ),
    limit: z.preprocess(
        (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
        z.coerce.number().int().min(1).max(25).default(8),
    ),
})
export type AgentSearchQuery = z.infer<typeof AgentSearchQuerySchema>
