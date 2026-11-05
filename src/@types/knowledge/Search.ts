import { z } from 'zod'

export const SEARCH_TYPES = ['article', 'asset'] as const
export type SearchItemType = (typeof SEARCH_TYPES)[number]

/** One search hit (article or library asset), ranked by Postgres full-text search */
export interface SearchResult {
    type: SearchItemType
    id: string
    title: string
    summary: string
    /** Article kind or asset kind */
    kind: string
    clientId: string | null
    productId: string | null
    status: 'draft' | 'published' | 'archived'
    updatedAt: Date
    /** A fragment of the body with the matched words in **bold** (Markdown) */
    snippet: string
    /** Where it opens in the app */
    path: string
}

/** GET /api/search (signed in) */
export const SearchQuerySchema = z.object({
    q: z.string().trim().min(1, 'Type something to search for').max(200),
    clientId: z.string().uuid().optional(),
    productId: z.string().uuid().optional(),
    type: z.enum(['all', ...SEARCH_TYPES]).default('all'),
    limit: z.coerce.number().int().min(1).max(50).default(20),
})
export type SearchQuery = z.infer<typeof SearchQuerySchema>
