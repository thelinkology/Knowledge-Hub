import 'server-only'
import { supabaseAdmin } from '@/server/data/supabase/admin'
import { check, toAppError, unwrap, unwrapMaybe } from '@/server/data/supabase/errors'
import { recordAudit } from '@/server/actions/audit'
import { assertClientExists, getClientOptions } from '@/server/actions/clients'
import { getProducts, knownProductIds } from '@/server/actions/products'
import {
    ARTICLE_SELECT,
    ARTICLE_SUMMARY_SELECT,
    COLLECTION_SELECT,
    mapArticle,
    mapArticleSummary,
    mapCollection,
    type ArticleRow,
    type ArticleSummaryRow,
    type CollectionRow,
} from './mappers'
import { getPublishIssues } from '@/utils/articleValidation'
import { getArticlePath, getAssetPath } from '@/configs/app.config'
import { ConflictError, DataError, NotFoundError } from '@/@types/errors'
import { hasPermission } from '@/@types/auth/Roles'
import type { SessionUser } from '@/@types/auth/SessionUser'
import type { PublishStatus } from '@/@types/shared/PublishStatusOptions'
import type {
    Article,
    ArticleRevision,
    ArticlesQuery,
    ArticleSummary,
    ArticleView,
    NewArticleInput,
    SaveArticleInput,
} from '@/@types/knowledge/Article'
import type { CollectionInput, KnowledgeCollection } from '@/@types/knowledge/KnowledgeCollection'
import type { ArticleEditorData } from '@/@types/knowledge/ArticleEditor'
import type { SearchQuery, SearchResult } from '@/@types/knowledge/Search'

/*
 * Knowledge: collections (ordered groups, like Microsoft Learn modules) and articles. Viewers only ever
 * get published items; editors also see drafts and archived ones. Writes are made by editors (the
 * routes check `knowledge.manage`) after the checks here.
 */

export const canEdit = (user: SessionUser) => hasPermission(user.role, 'knowledge.manage')

const notFound = () => new NotFoundError('That article doesn’t exist (or isn’t published yet).', 'ARTICLE_NOT_FOUND')
const collectionNotFound = () => new NotFoundError('That collection doesn’t exist.', 'COLLECTION_NOT_FOUND')

// ── Collections ───────────────────────────────────────────────────────────────────────────────────

export async function getCollections(
    user: SessionUser,
    { clientId, productId }: { clientId?: string; productId?: string } = {},
): Promise<KnowledgeCollection[]> {
    let query = supabaseAdmin()
        .from('collections')
        .select(COLLECTION_SELECT)
        .order('position')
        .order('title')
        .limit(500)
    if (!canEdit(user)) query = query.eq('status', 'published').eq('articles.status', 'published')
    else query = query.neq('status', 'archived')
    if (clientId) query = query.eq('client_id', clientId)
    if (productId) query = query.eq('product_id', productId)
    return unwrap(await query, 'load collections').map((row) => mapCollection(row as unknown as CollectionRow))
}

async function findCollection(collectionId: string) {
    return unwrapMaybe(
        await supabaseAdmin()
            .from('collections')
            .select('id, title, status, client_id')
            .eq('id', collectionId)
            .maybeSingle(),
        'find the collection',
    )
}

export async function getCollection(
    user: SessionUser,
    collectionId: string,
): Promise<{ collection: KnowledgeCollection; articles: ArticleSummary[] }> {
    const row = unwrapMaybe(
        await supabaseAdmin().from('collections').select(COLLECTION_SELECT).eq('id', collectionId).maybeSingle(),
        'load the collection',
    )
    if (!row || (!canEdit(user) && row.status !== 'published')) throw collectionNotFound()
    let articles = supabaseAdmin()
        .from('articles')
        .select(ARTICLE_SUMMARY_SELECT)
        .eq('collection_id', collectionId)
        .order('position')
        .order('created_at')
    articles = canEdit(user) ? articles.neq('status', 'archived') : articles.eq('status', 'published')
    const list = unwrap(await articles, 'load the articles').map((a) =>
        mapArticleSummary(a as unknown as ArticleSummaryRow),
    )
    return {
        collection: { ...mapCollection(row as unknown as CollectionRow), articleCount: list.length },
        articles: list,
    }
}

const collectionRow = async (input: CollectionInput) => {
    await assertClientExists(input.clientId)
    return {
        title: input.title,
        summary: input.summary,
        client_id: input.clientId,
        product_id: (await knownProductIds(input.productId ? [input.productId] : []))[0] ?? null,
        status: input.status,
    }
}

export async function createCollection(user: SessionUser, input: CollectionInput): Promise<KnowledgeCollection> {
    const inserted = unwrap(
        await supabaseAdmin()
            .from('collections')
            .insert({ ...(await collectionRow(input)), created_by: user.id })
            .select('id')
            .single(),
        'create the collection',
    )
    await recordAudit(user.id, 'collection.created', 'collection', inserted.id, { title: input.title })
    return (await getCollection(user, inserted.id)).collection
}

export async function updateCollection(
    user: SessionUser,
    collectionId: string,
    input: CollectionInput,
): Promise<KnowledgeCollection> {
    if (!(await findCollection(collectionId))) throw collectionNotFound()
    check(
        await supabaseAdmin()
            .from('collections')
            .update(await collectionRow(input))
            .eq('id', collectionId),
        'save the collection',
    )
    return (await getCollection(user, collectionId)).collection
}

/** Deletes the collection; its articles stay (no longer grouped) */
export async function deleteCollection(user: SessionUser, collectionId: string) {
    const existing = await findCollection(collectionId)
    if (!existing) throw collectionNotFound()
    check(await supabaseAdmin().from('collections').delete().eq('id', collectionId), 'delete the collection')
    await recordAudit(user.id, 'collection.deleted', 'collection', collectionId, { title: existing.title })
}

/** Sets the reading order. Every id must be an article of this collection. */
export async function reorderCollection(collectionId: string, ids: string[]) {
    if (!(await findCollection(collectionId))) throw collectionNotFound()
    const rows = unwrap(
        await supabaseAdmin().from('articles').select('id').eq('collection_id', collectionId),
        'load the articles',
    )
    const mine = new Set(rows.map((r) => r.id))
    if (ids.some((id) => !mine.has(id))) throw new DataError('Some of those articles aren’t in this collection.')
    const db = supabaseAdmin()
    for (const [position, id] of ids.entries()) {
        check(await db.from('articles').update({ position }).eq('id', id), 'save the order')
    }
}

// ── Articles ──────────────────────────────────────────────────────────────────────────────────────

export async function getArticles(user: SessionUser, query: ArticlesQuery): Promise<ArticleSummary[]> {
    let q = supabaseAdmin()
        .from('articles')
        .select(ARTICLE_SUMMARY_SELECT)
        .order('updated_at', { ascending: false })
        .limit(200)
    if (!canEdit(user)) q = q.eq('status', 'published')
    else if (query.status) q = q.eq('status', query.status)
    else q = q.neq('status', 'archived')
    if (query.clientId) q = q.eq('client_id', query.clientId)
    else if (query.scope === 'shared') q = q.is('client_id', null)
    if (query.productId) q = q.eq('product_id', query.productId)
    if (query.collectionId) q = q.eq('collection_id', query.collectionId)
    if (query.kind) q = q.eq('kind', query.kind)
    if (query.q) {
        const term = query.q.replace(/[%_,()\\]/g, ' ').trim()
        if (term) q = q.or(`title.ilike.%${term}%,summary.ilike.%${term}%`)
    }
    return unwrap(await q, 'load articles').map((row) => mapArticleSummary(row as unknown as ArticleSummaryRow))
}

async function loadArticle(articleId: string): Promise<Article | null> {
    const row = unwrapMaybe(
        await supabaseAdmin().from('articles').select(ARTICLE_SELECT).eq('id', articleId).maybeSingle(),
        'load the article',
    )
    return row ? mapArticle(row as unknown as ArticleRow) : null
}

/** The reader view. Viewers get 404 for anything unpublished, so drafts can't be probed. */
export async function getArticleView(user: SessionUser, articleId: string): Promise<ArticleView> {
    const article = await loadArticle(articleId)
    if (!article || (!canEdit(user) && article.status !== 'published')) throw notFound()
    if (!article.collectionId) return { article, collection: null }
    const { collection, articles } = await getCollection(user, article.collectionId).catch(() => ({
        collection: null,
        articles: [],
    }))
    return {
        article,
        collection: collection
            ? {
                  id: collection.id,
                  title: collection.title,
                  articles: articles.map((a) => ({ id: a.id, title: a.title, status: a.status })),
              }
            : null,
    }
}

/** Everything the editor needs: the article plus the choices for its pickers */
export async function getArticleEditor(articleId: string): Promise<ArticleEditorData> {
    const article = await loadArticle(articleId)
    if (!article) throw notFound()
    const [collections, clients, products] = await Promise.all([
        unwrap(
            await supabaseAdmin()
                .from('collections')
                .select('id, title, client_id')
                .neq('status', 'archived')
                .order('title')
                .limit(500),
            'load collections',
        ),
        getClientOptions(),
        getProducts(),
    ])
    return {
        article,
        collections: collections.map((c) => ({ id: c.id, title: c.title, clientId: c.client_id })),
        clients,
        products,
    }
}

async function nextPosition(collectionId: string | null) {
    if (!collectionId) return 0
    const last = unwrapMaybe(
        await supabaseAdmin()
            .from('articles')
            .select('position')
            .eq('collection_id', collectionId)
            .order('position', { ascending: false })
            .limit(1)
            .maybeSingle(),
        'place the article',
    )
    return (last?.position ?? -1) + 1
}

/** Checks the pickers' ids: the collection, client and product must exist */
async function checkPlacement(input: {
    collectionId: string | null
    clientId: string | null
    productId: string | null
}) {
    if (input.collectionId && !(await findCollection(input.collectionId))) {
        throw new DataError('That collection doesn’t exist.', 'COLLECTION_NOT_FOUND')
    }
    await assertClientExists(input.clientId)
    if (input.productId && !(await knownProductIds([input.productId])).length) {
        throw new DataError('That product doesn’t exist.', 'PRODUCT_NOT_FOUND')
    }
}

export async function createArticle(user: SessionUser, input: NewArticleInput): Promise<Article> {
    await checkPlacement(input)
    const db = supabaseAdmin()
    const inserted = unwrap(
        await db
            .from('articles')
            .insert({
                title: input.title,
                kind: input.kind,
                collection_id: input.collectionId,
                client_id: input.clientId,
                product_id: input.productId,
                position: await nextPosition(input.collectionId),
                created_by: user.id,
                updated_by: user.id,
            })
            .select('id, title, summary, body')
            .single(),
        'create the article',
    )
    check(
        await db.from('article_revisions').insert({
            article_id: inserted.id,
            version: 1,
            title: inserted.title,
            summary: inserted.summary,
            body: inserted.body,
            saved_by: user.id,
        }),
        'create the article',
    )
    return (await loadArticle(inserted.id)) as Article
}

/**
 * The editor's save: one transaction updates the article and snapshots the new version
 * (public.save_article). A save based on an older version than the stored one is refused, so two
 * editors can't silently overwrite each other.
 */
export async function saveArticle(user: SessionUser, articleId: string, input: SaveArticleInput) {
    const existing = await loadArticle(articleId)
    if (!existing) throw notFound()
    await checkPlacement(input)
    if (existing.status === 'published') {
        const issues = getPublishIssues(input)
        if (issues.length) {
            throw new DataError(
                `This article is published, so it must stay complete: ${issues[0].message}`,
                'INCOMPLETE',
            )
        }
    }
    const moved = input.collectionId !== existing.collectionId
    const result = await supabaseAdmin().rpc('save_article', {
        p_article_id: articleId,
        p_fields: {
            title: input.title,
            summary: input.summary,
            body: input.body,
            kind: input.kind,
            audience: input.audience,
            collectionId: input.collectionId,
            clientId: input.clientId,
            productId: input.productId,
            tags: input.tags,
        },
        p_saved_by: user.id,
        p_expected_version: input.expectedVersion as number,
    })
    if (result.error) throw toAppError(result.error, 'save the article')
    if (moved) {
        check(
            await supabaseAdmin()
                .from('articles')
                .update({ position: await nextPosition(input.collectionId) })
                .eq('id', articleId),
            'place the article',
        )
    }
    return getArticleEditor(articleId)
}

export async function setArticleStatus(user: SessionUser, articleId: string, status: PublishStatus) {
    const article = await loadArticle(articleId)
    if (!article) throw notFound()
    if (status === 'published') {
        const issues = getPublishIssues(article)
        if (issues.length) throw new ConflictError(`Can’t publish yet: ${issues[0].message}`, 'NOT_READY')
    }
    check(
        await supabaseAdmin()
            .from('articles')
            .update({
                status,
                updated_by: user.id,
                ...(status === 'published' && !article.publishedAt ? { published_at: new Date().toISOString() } : {}),
            })
            .eq('id', articleId),
        'change the status',
    )
    await recordAudit(user.id, `article.${status}`, 'article', articleId, { title: article.title })
    return getArticleEditor(articleId)
}

export async function deleteArticle(user: SessionUser, articleId: string) {
    const article = await loadArticle(articleId)
    if (!article) throw notFound()
    check(await supabaseAdmin().from('articles').delete().eq('id', articleId), 'delete the article')
    await recordAudit(user.id, 'article.deleted', 'article', articleId, { title: article.title })
}

export async function getArticleRevisions(articleId: string): Promise<ArticleRevision[]> {
    if (!(await loadArticle(articleId))) throw notFound()
    const rows = unwrap(
        await supabaseAdmin()
            .from('article_revisions')
            .select('id, version, title, summary, body, created_at, saver:profiles(display_name)')
            .eq('article_id', articleId)
            .order('version', { ascending: false })
            .limit(100),
        'load the history',
    )
    return rows.map((row) => ({
        id: row.id,
        version: row.version,
        title: row.title,
        summary: row.summary,
        body: row.body,
        savedByName: (row.saver as { display_name: string } | null)?.display_name ?? null,
        createdAt: new Date(row.created_at),
    }))
}

/** Restoring saves the old text as a new version (history is never rewritten) */
export async function restoreArticleRevision(user: SessionUser, articleId: string, revisionId: string) {
    const article = await loadArticle(articleId)
    if (!article) throw notFound()
    const revision = unwrapMaybe(
        await supabaseAdmin()
            .from('article_revisions')
            .select('version, title, summary, body')
            .eq('id', revisionId)
            .eq('article_id', articleId)
            .maybeSingle(),
        'find the version',
    )
    if (!revision) throw new NotFoundError('That version doesn’t exist.', 'REVISION_NOT_FOUND')
    const result = await saveArticle(user, articleId, {
        title: revision.title,
        summary: revision.summary,
        body: revision.body,
        kind: article.kind,
        audience: article.audience,
        collectionId: article.collectionId,
        clientId: article.clientId,
        productId: article.productId,
        tags: article.tags,
        expectedVersion: null,
    })
    await recordAudit(user.id, 'article.restored', 'article', articleId, { version: revision.version })
    return result
}

// ── Search ────────────────────────────────────────────────────────────────────────────────────────

/** Ranked full-text search over articles and library assets (public.search_knowledge) */
export async function searchKnowledge(
    query: SearchQuery,
    { includeDrafts, clientScope }: { includeDrafts: boolean; clientScope?: string | null },
): Promise<SearchResult[]> {
    const result = await supabaseAdmin().rpc('search_knowledge', {
        p_query: query.q,
        p_client_id: (clientScope ?? query.clientId ?? null) as string,
        p_product_id: (query.productId ?? null) as string,
        p_types: query.type === 'all' ? ['article', 'asset'] : [query.type],
        p_include_drafts: includeDrafts,
        p_limit: query.limit,
    })
    if (result.error) throw toAppError(result.error, 'search')
    return (result.data ?? []).map((row) => {
        const type = row.item_type === 'asset' ? 'asset' : 'article'
        return {
            type,
            id: row.id,
            title: row.title,
            summary: row.summary,
            kind: row.kind,
            clientId: row.client_id,
            productId: row.product_id,
            status: row.status,
            updatedAt: new Date(row.updated_at),
            snippet: row.snippet,
            path: type === 'asset' ? getAssetPath(row.id) : getArticlePath(row.id),
        }
    })
}
