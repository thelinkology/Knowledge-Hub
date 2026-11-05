import useSWR, { type SWRConfiguration } from 'swr'
import api from '@/services/api'
import { tryParseDate } from '@/utils/parse'
import type {
    Article,
    ArticleRevision,
    ArticlesQuery,
    ArticleSummary,
    ArticleView,
    NewArticleInput,
    SaveArticleInput,
} from '@/@types/knowledge/Article'
import type { ArticleEditorData } from '@/@types/knowledge/ArticleEditor'
import type { CollectionInput, KnowledgeCollection } from '@/@types/knowledge/KnowledgeCollection'
import type { SearchQuery, SearchResult } from '@/@types/knowledge/Search'
import type { PublishStatus } from '@/@types/shared/PublishStatusOptions'

// ── Date revivers (JSON has strings) ──

export const ensureArticleSummary = <T extends ArticleSummary>(a: T): T => ({
    ...a,
    updatedAt: tryParseDate(a.updatedAt) as Date,
    publishedAt: tryParseDate(a.publishedAt),
})

export const ensureArticle = (a: Article): Article => ({
    ...ensureArticleSummary(a),
    createdAt: tryParseDate(a.createdAt) as Date,
})

export const ensureCollection = (c: KnowledgeCollection): KnowledgeCollection => ({
    ...c,
    updatedAt: tryParseDate(c.updatedAt) as Date,
})

const ensureEditor = (data: ArticleEditorData): ArticleEditorData => ({ ...data, article: ensureArticle(data.article) })

const toParams = (query: object) => {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) if (value) params.set(key, String(value))
    const s = params.toString()
    return s ? `?${s}` : ''
}

// ── Articles ──

export const getArticlesUrl = (query: Partial<ArticlesQuery>) => `/articles${toParams(query)}`

export const apiGetArticles = async (query: Partial<ArticlesQuery>) =>
    (await api.fetchJson<ArticleSummary[]>({ method: 'get', url: getArticlesUrl(query) })).map(ensureArticleSummary)

export const useSWRArticles = (query: Partial<ArticlesQuery> | null, config?: SWRConfiguration<ArticleSummary[]>) =>
    useSWR(query ? getArticlesUrl(query) : null, () => apiGetArticles(query!), { keepPreviousData: true, ...config })

export const getArticleUrl = (articleId: string) => `/articles/${articleId}`

export const apiGetArticleView = async (articleId: string): Promise<ArticleView> => {
    const view = await api.fetchJson<ArticleView>({ method: 'get', url: getArticleUrl(articleId) })
    return { ...view, article: ensureArticle(view.article) }
}

export const useSWRArticleView = (articleId: string | null, config?: SWRConfiguration<ArticleView>) =>
    useSWR(articleId ? getArticleUrl(articleId) : null, () => apiGetArticleView(articleId!), config)

export const apiCreateArticle = async (input: NewArticleInput) =>
    ensureArticle(await api.fetchJson<Article>({ method: 'post', url: '/articles', data: input }))

export const getArticleEditorUrl = (articleId: string) => `/articles/${articleId}/editor`

export const apiGetArticleEditor = async (articleId: string) =>
    ensureEditor(await api.fetchJson<ArticleEditorData>({ method: 'get', url: getArticleEditorUrl(articleId) }))

export const useSWRArticleEditor = (articleId: string | null, config?: SWRConfiguration<ArticleEditorData>) =>
    useSWR(articleId ? getArticleEditorUrl(articleId) : null, () => apiGetArticleEditor(articleId!), {
        // The editor owns its form state; don't reload it underneath the author
        revalidateOnFocus: false,
        ...config,
    })

export const apiSaveArticle = async (articleId: string, input: SaveArticleInput) =>
    ensureEditor(await api.fetchJson<ArticleEditorData>({ method: 'put', url: getArticleUrl(articleId), data: input }))

export const apiSetArticleStatus = async (articleId: string, status: PublishStatus) =>
    ensureEditor(
        await api.fetchJson<ArticleEditorData>({
            method: 'post',
            url: `${getArticleUrl(articleId)}/status`,
            data: { status },
        }),
    )

export const apiDeleteArticle = (articleId: string) =>
    api.fetchJson<void>({ method: 'delete', url: getArticleUrl(articleId) })

export const getRevisionsUrl = (articleId: string) => `/articles/${articleId}/revisions`

export const useSWRArticleRevisions = (articleId: string | null, config?: SWRConfiguration<ArticleRevision[]>) =>
    useSWR(
        articleId ? getRevisionsUrl(articleId) : null,
        async () =>
            (await api.fetchJson<ArticleRevision[]>({ method: 'get', url: getRevisionsUrl(articleId!) })).map((r) => ({
                ...r,
                createdAt: tryParseDate(r.createdAt) as Date,
            })),
        config,
    )

export const apiRestoreRevision = async (articleId: string, revisionId: string) =>
    ensureEditor(
        await api.fetchJson<ArticleEditorData>({
            method: 'post',
            url: `${getRevisionsUrl(articleId)}/${revisionId}`,
        }),
    )

// ── Collections ──

export const getCollectionsUrl = (query: { clientId?: string; productId?: string } = {}) =>
    `/collections${toParams(query)}`

export const apiGetCollections = async (query: { clientId?: string; productId?: string } = {}) =>
    (await api.fetchJson<KnowledgeCollection[]>({ method: 'get', url: getCollectionsUrl(query) })).map(ensureCollection)

export const useSWRCollections = (
    query: { clientId?: string; productId?: string } | null,
    config?: SWRConfiguration<KnowledgeCollection[]>,
) => useSWR(query ? getCollectionsUrl(query) : null, () => apiGetCollections(query!), config)

export interface CollectionDetail {
    collection: KnowledgeCollection
    articles: ArticleSummary[]
}

export const getCollectionUrl = (collectionId: string) => `/collections/${collectionId}`

export const apiGetCollection = async (collectionId: string): Promise<CollectionDetail> => {
    const detail = await api.fetchJson<CollectionDetail>({ method: 'get', url: getCollectionUrl(collectionId) })
    return { collection: ensureCollection(detail.collection), articles: detail.articles.map(ensureArticleSummary) }
}

export const useSWRCollection = (collectionId: string | null, config?: SWRConfiguration<CollectionDetail>) =>
    useSWR(collectionId ? getCollectionUrl(collectionId) : null, () => apiGetCollection(collectionId!), config)

export const apiCreateCollection = async (input: CollectionInput) =>
    ensureCollection(await api.fetchJson<KnowledgeCollection>({ method: 'post', url: '/collections', data: input }))

export const apiUpdateCollection = async (collectionId: string, input: CollectionInput) =>
    ensureCollection(
        await api.fetchJson<KnowledgeCollection>({ method: 'put', url: getCollectionUrl(collectionId), data: input }),
    )

export const apiDeleteCollection = (collectionId: string) =>
    api.fetchJson<void>({ method: 'delete', url: getCollectionUrl(collectionId) })

export const apiReorderCollection = (collectionId: string, ids: string[]) =>
    api.fetchJson<void>({ method: 'put', url: `${getCollectionUrl(collectionId)}/order`, data: { ids } })

// ── Search ──

export const getSearchUrl = (query: Partial<SearchQuery>) => `/search${toParams(query)}`

export const apiSearch = async (query: Partial<SearchQuery>) =>
    (await api.fetchJson<SearchResult[]>({ method: 'get', url: getSearchUrl(query) })).map((r) => ({
        ...r,
        updatedAt: tryParseDate(r.updatedAt) as Date,
    }))

export const useSWRSearch = (query: Partial<SearchQuery> | null, config?: SWRConfiguration<SearchResult[]>) =>
    useSWR(query?.q ? getSearchUrl(query) : null, () => apiSearch(query!), { keepPreviousData: true, ...config })
