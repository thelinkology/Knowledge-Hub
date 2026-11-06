import 'server-only'
import { supabaseAdmin } from '@/server/data/supabase/admin'
import { unwrap, unwrapMaybe } from '@/server/data/supabase/errors'
import { searchKnowledge } from '@/server/actions/knowledge'
import { getProducts } from '@/server/actions/products'
import { NotFoundError } from '@/@types/errors'
import { getArticlePath, getAssetPath } from '@/configs/app.config'
import { absolutizeMarkdownLinks } from '@/utils/apiKeys'
import { isUuid } from '@/utils/ids'
import { diagramToMarkdown } from '@/utils/diagram'
import { parseDiagram } from '@/@types/library/Diagram'
import type {
    AgentArticle,
    AgentAsset,
    AgentClient,
    AgentClientRef,
    AgentContext,
    AgentProductRef,
    AgentSearchQuery,
    AgentSearchResult,
} from '@/@types/integrations/AgentApi'

/*
 * What an agent (Copilot Studio) may read through /api/v1: PUBLISHED articles and library assets only, and
 * for a client-scoped key only that client's knowledge plus shared knowledge (client_id null). Anything
 * outside that is a 404, exactly like something that doesn't exist, so nothing can be probed.
 */

/** Shared knowledge, or the key's own client (an unscoped key reads every client) */
const inScope = (agent: AgentContext, clientId: string | null) =>
    !agent.clientId || clientId === null || clientId === agent.clientId

const articleNotFound = () =>
    new NotFoundError('No published article has that id. Use SearchKnowledge to find articles.', 'ARTICLE_NOT_FOUND')
const assetNotFound = () =>
    new NotFoundError('No published library asset has that id. Use SearchKnowledge to find assets.', 'ASSET_NOT_FOUND')

/** id/slug/name of the given clients, by id */
async function clientRefs(ids: (string | null)[]): Promise<Map<string, AgentClientRef>> {
    const unique = [...new Set(ids.filter((id): id is string => !!id))]
    if (!unique.length) return new Map()
    const rows = unwrap(
        await supabaseAdmin().from('clients').select('id, slug, name').in('id', unique),
        'load the clients',
    )
    return new Map(rows.map((row) => [row.id, row]))
}

async function productRefs(): Promise<Map<string, AgentProductRef>> {
    return new Map((await getProducts()).map((p) => [p.id, { id: p.id, code: p.code, name: p.name }]))
}

/**
 * The `client` filter (a slug or an id). A scoped key can only name its own client; any other value is
 * reported as unknown (the same answer as for a client that doesn't exist).
 */
async function resolveClientFilter(agent: AgentContext, value: string | undefined): Promise<string | null> {
    if (!value) return agent.clientId
    const query = supabaseAdmin().from('clients').select('id')
    const slug = value.toLowerCase()
    const row = unwrapMaybe(
        await (isUuid(value) ? query.eq('id', value) : query.eq('slug', slug)).maybeSingle(),
        'find the client',
    )
    if (!row || (agent.clientId && row.id !== agent.clientId)) {
        throw new NotFoundError(
            `No client matches “${value}”. Call ListClients for the client slugs you can use, or leave client empty.`,
            'CLIENT_NOT_FOUND',
        )
    }
    return row.id
}

/** The `product` filter (a code such as "fabric", or an id) */
async function resolveProductFilter(value: string | undefined): Promise<string | undefined> {
    if (!value) return undefined
    const wanted = value.toLowerCase()
    const products = await getProducts()
    const product = products.find((p) => p.id === wanted || p.code === wanted)
    if (!product) {
        const codes = products
            .filter((p) => p.active)
            .map((p) => p.code)
            .join(', ')
        throw new NotFoundError(`No product matches “${value}”. Known product codes: ${codes}.`, 'PRODUCT_NOT_FOUND')
    }
    return product.id
}

export async function agentSearch(
    agent: AgentContext,
    query: AgentSearchQuery,
    origin: string,
): Promise<{ results: AgentSearchResult[] }> {
    const [clientId, productId] = await Promise.all([
        resolveClientFilter(agent, query.client),
        resolveProductFilter(query.product),
    ])
    const hits = (
        await searchKnowledge(
            { q: query.q, clientId: clientId ?? undefined, productId, type: query.type, limit: query.limit },
            { includeDrafts: false, clientScope: agent.clientId },
        )
    ).filter((hit) => hit.status === 'published' && inScope(agent, hit.clientId))
    const [clients, products] = await Promise.all([clientRefs(hits.map((h) => h.clientId)), productRefs()])
    return {
        results: hits.map((hit) => ({
            id: hit.id,
            type: hit.type,
            title: hit.title,
            summary: hit.summary,
            snippet: hit.snippet || hit.summary,
            kind: hit.kind,
            client: hit.clientId ? (clients.get(hit.clientId) ?? null) : null,
            product: hit.productId ? (products.get(hit.productId) ?? null) : null,
            updatedAt: hit.updatedAt.toISOString(),
            url: `${origin}${hit.type === 'asset' ? getAssetPath(hit.id) : getArticlePath(hit.id)}`,
        })),
    }
}

export async function agentGetArticle(agent: AgentContext, articleId: string, origin: string): Promise<AgentArticle> {
    const row = unwrapMaybe(
        await supabaseAdmin()
            .from('articles')
            .select('id, title, summary, kind, audience, client_id, product_id, tags, updated_at, body, parent_id')
            .eq('id', articleId)
            .eq('status', 'published')
            .maybeSingle(),
        'load the article',
    )
    if (!row || !inScope(agent, row.client_id)) throw articleNotFound()
    // Its place in the table of contents: the parent and the sub-articles (published and in scope only)
    const db = supabaseAdmin()
    const [clients, products, parentRow, childRows] = await Promise.all([
        clientRefs([row.client_id]),
        productRefs(),
        row.parent_id
            ? db
                  .from('articles')
                  .select('id, title, client_id')
                  .eq('id', row.parent_id)
                  .eq('status', 'published')
                  .maybeSingle()
                  .then((result) => unwrapMaybe(result, 'load the article'))
            : null,
        db
            .from('articles')
            .select('id, title, summary, client_id')
            .eq('parent_id', row.id)
            .eq('status', 'published')
            .order('position')
            .order('title')
            .limit(100)
            .then((result) => unwrap(result, 'load the article')),
    ])
    const parent = parentRow && inScope(agent, parentRow.client_id) ? parentRow : null
    return {
        id: row.id,
        title: row.title,
        summary: row.summary,
        kind: row.kind,
        audience: row.audience,
        client: row.client_id ? (clients.get(row.client_id) ?? null) : null,
        product: row.product_id ? (products.get(row.product_id) ?? null) : null,
        tags: row.tags,
        updatedAt: new Date(row.updated_at).toISOString(),
        url: `${origin}${getArticlePath(row.id)}`,
        content: absolutizeMarkdownLinks(row.body, origin),
        parent: parent ? { id: parent.id, title: parent.title, url: `${origin}${getArticlePath(parent.id)}` } : null,
        children: childRows
            .filter((child) => inScope(agent, child.client_id))
            .map((child) => ({
                id: child.id,
                title: child.title,
                summary: child.summary,
                url: `${origin}${getArticlePath(child.id)}`,
            })),
    }
}

export async function agentGetAsset(agent: AgentContext, assetId: string, origin: string): Promise<AgentAsset> {
    const row = unwrapMaybe(
        await supabaseAdmin()
            .from('library_assets')
            .select(
                'id, title, summary, kind, client_id, product_id, tags, updated_at, body, url, code, code_language, diagram',
            )
            .eq('id', assetId)
            .eq('status', 'published')
            .maybeSingle(),
        'load the asset',
    )
    if (!row || !inScope(agent, row.client_id)) throw assetNotFound()
    const [clients, products] = await Promise.all([clientRefs([row.client_id]), productRefs()])
    return {
        id: row.id,
        title: row.title,
        summary: row.summary,
        kind: row.kind,
        client: row.client_id ? (clients.get(row.client_id) ?? null) : null,
        product: row.product_id ? (products.get(row.product_id) ?? null) : null,
        tags: row.tags,
        updatedAt: new Date(row.updated_at).toISOString(),
        url: `${origin}${getAssetPath(row.id)}`,
        content: absolutizeMarkdownLinks(row.body, origin),
        code: row.code,
        codeLanguage: row.code_language,
        link: row.url,
        diagramMarkdown: absolutizeMarkdownLinks(diagramToMarkdown(parseDiagram(row.diagram), row.title), origin),
    }
}

/** The clients a key may filter by (a scoped key: only its own) */
export async function agentListClients(agent: AgentContext): Promise<{ clients: AgentClient[] }> {
    let query = supabaseAdmin()
        .from('clients')
        .select('id, slug, name, industry, summary, status')
        .order('name')
        .limit(1000)
    if (agent.clientId) query = query.eq('id', agent.clientId)
    return { clients: unwrap(await query, 'load the clients') }
}
