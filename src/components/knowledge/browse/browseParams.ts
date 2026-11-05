import { knowledgePath } from '@/configs/app.config'
import { ARTICLE_KINDS, type ArticleKind } from '@/@types/knowledge/ArticleKindOptions'
import { SEARCH_TYPES, type SearchItemType } from '@/@types/knowledge/Search'
import { isUuid } from '@/utils/ids'

/** The client filter's value for "shared knowledge only" (no client) */
export const SHARED_CLIENT = 'shared'

export type BrowseSearchType = 'all' | SearchItemType

/** The knowledge browser's state, kept in the URL so it can be shared and survives back/forward */
export interface BrowseFilters {
    q: string
    /** A product id, or '' for every product */
    product: string
    /** A client id, SHARED_CLIENT, or '' for everything */
    client: string
    kind: ArticleKind | ''
    /** Search only: articles, library assets or both */
    type: BrowseSearchType
}

interface ReadableParams {
    get: (name: string) => string | null
}

const isKind = (value: string): value is ArticleKind => (ARTICLE_KINDS as readonly string[]).includes(value)
const isSearchType = (value: string): value is SearchItemType => (SEARCH_TYPES as readonly string[]).includes(value)

/** Reads (and sanitises) the filters from the query string; unknown values are ignored */
export function readBrowseFilters(params: ReadableParams): BrowseFilters {
    const product = params.get('product') ?? ''
    const client = params.get('client') ?? ''
    const kind = params.get('kind') ?? ''
    const type = params.get('type') ?? ''
    return {
        q: (params.get('q') ?? '').trim().slice(0, 200),
        product: isUuid(product) ? product : '',
        client: client === SHARED_CLIENT || isUuid(client) ? client : '',
        kind: isKind(kind) ? kind : '',
        type: isSearchType(type) ? type : 'all',
    }
}

/** The knowledge browser's URL for these filters (empty values are left out) */
export function getBrowseHref(filters: Partial<BrowseFilters>) {
    const params = new URLSearchParams()
    if (filters.q?.trim()) params.set('q', filters.q.trim())
    if (filters.product) params.set('product', filters.product)
    if (filters.client) params.set('client', filters.client)
    if (filters.kind) params.set('kind', filters.kind)
    if (filters.type && filters.type !== 'all') params.set('type', filters.type)
    const query = params.toString()
    return query ? `${knowledgePath}?${query}` : knowledgePath
}

export const hasNarrowingFilters = (filters: BrowseFilters) => !!(filters.product || filters.client || filters.kind)
