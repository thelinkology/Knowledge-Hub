import 'server-only'
import type { Article, ArticleSummary } from '@/@types/knowledge/Article'
import type { KnowledgeCollection } from '@/@types/knowledge/KnowledgeCollection'
import type { Database } from '@/@types/supabase/database.types'

type Enums = Database['public']['Enums']

export const ARTICLE_SUMMARY_SELECT =
    'id, title, summary, kind, audience, status, collection_id, client_id, product_id, tags, position, version, updated_at, published_at, collection:collections(title), client:clients(name)'

export const ARTICLE_SELECT = `${ARTICLE_SUMMARY_SELECT}, body, created_at, creator:profiles!articles_created_by_fkey(display_name), updater:profiles!articles_updated_by_fkey(display_name)`

export interface ArticleSummaryRow {
    id: string
    title: string
    summary: string
    kind: Enums['article_kind']
    audience: Enums['audience']
    status: Enums['publish_status']
    collection_id: string | null
    client_id: string | null
    product_id: string | null
    tags: string[]
    position: number
    version: number
    updated_at: string
    published_at: string | null
    collection: { title: string } | null
    client: { name: string } | null
}

export interface ArticleRow extends ArticleSummaryRow {
    body: string
    created_at: string
    creator: { display_name: string } | null
    updater: { display_name: string } | null
}

export const mapArticleSummary = (row: ArticleSummaryRow): ArticleSummary => ({
    id: row.id,
    title: row.title,
    summary: row.summary,
    kind: row.kind,
    audience: row.audience,
    status: row.status,
    collectionId: row.collection_id,
    collectionTitle: row.collection?.title ?? null,
    clientId: row.client_id,
    clientName: row.client?.name ?? null,
    productId: row.product_id,
    tags: row.tags,
    position: row.position,
    version: row.version,
    updatedAt: new Date(row.updated_at),
    publishedAt: row.published_at ? new Date(row.published_at) : null,
})

export const mapArticle = (row: ArticleRow): Article => ({
    ...mapArticleSummary(row),
    body: row.body,
    createdByName: row.creator?.display_name ?? null,
    updatedByName: row.updater?.display_name ?? null,
    createdAt: new Date(row.created_at),
})

export const COLLECTION_SELECT =
    'id, title, summary, status, client_id, product_id, position, updated_at, client:clients(name), articles(count)'

export interface CollectionRow {
    id: string
    title: string
    summary: string
    status: Enums['publish_status']
    client_id: string | null
    product_id: string | null
    position: number
    updated_at: string
    client: { name: string } | null
    articles: { count: number }[]
}

export const mapCollection = (row: CollectionRow): KnowledgeCollection => ({
    id: row.id,
    title: row.title,
    summary: row.summary,
    status: row.status,
    clientId: row.client_id,
    clientName: row.client?.name ?? null,
    productId: row.product_id,
    position: row.position,
    articleCount: row.articles?.[0]?.count ?? 0,
    updatedAt: new Date(row.updated_at),
})
