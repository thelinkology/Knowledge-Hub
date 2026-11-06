import type { Article, ArticleTreeEntry } from './Article'
import type { ClientOption } from '@/@types/clients/Client'
import type { Product } from '@/@types/products/Product'

/** GET /api/articles/[articleId]/editor */
export interface ArticleEditorData {
    article: Article
    collections: { id: string; title: string; clientId: string | null }[]
    /** The table of contents of the article's collection (drafts included; empty without a collection) */
    collectionArticles: ArticleTreeEntry[]
    clients: ClientOption[]
    products: Product[]
}
