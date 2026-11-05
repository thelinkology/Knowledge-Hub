import type { Article } from './Article'
import type { ClientOption } from '@/@types/clients/Client'
import type { Product } from '@/@types/products/Product'

/** GET /api/articles/[articleId]/editor */
export interface ArticleEditorData {
    article: Article
    collections: { id: string; title: string; clientId: string | null }[]
    clients: ClientOption[]
    products: Product[]
}
