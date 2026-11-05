import { z } from 'zod'
import { ARTICLE_KINDS, type ArticleKind } from './ArticleKindOptions'
import { AUDIENCES, PUBLISH_STATUSES, type Audience, type PublishStatus } from '@/@types/shared/PublishStatusOptions'

export const TagsSchema = z
    .array(
        z
            .string()
            .trim()
            .toLowerCase()
            .min(1)
            .max(40)
            .regex(/^[^<>,]+$/, 'Tags can’t include < > or commas'),
    )
    .max(20, 'Use up to 20 tags')
    .transform((tags) => [...new Set(tags)])

/** An article as listed (no body) */
export interface ArticleSummary {
    id: string
    title: string
    summary: string
    kind: ArticleKind
    audience: Audience
    status: PublishStatus
    collectionId: string | null
    collectionTitle: string | null
    clientId: string | null
    clientName: string | null
    productId: string | null
    tags: string[]
    position: number
    version: number
    updatedAt: Date
    publishedAt: Date | null
}

export interface Article extends ArticleSummary {
    body: string
    createdByName: string | null
    updatedByName: string | null
    createdAt: Date
}

/** The reader view: the article plus its neighbours in the collection (Microsoft Learn-style unit navigation) */
export interface ArticleView {
    article: Article
    collection: { id: string; title: string; articles: { id: string; title: string; status: PublishStatus }[] } | null
}

export interface ArticleRevision {
    id: string
    version: number
    title: string
    summary: string
    body: string
    savedByName: string | null
    createdAt: Date
}

/** POST /api/articles — a new draft; the editor opens next */
export const NewArticleSchema = z.object({
    title: z.string().trim().min(2, 'Give the article a title').max(200),
    kind: z.enum(ARTICLE_KINDS).default('concept'),
    collectionId: z.string().uuid().nullable().default(null),
    clientId: z.string().uuid().nullable().default(null),
    productId: z.string().uuid().nullable().default(null),
})
export type NewArticleInput = z.infer<typeof NewArticleSchema>

/** PUT /api/articles/[articleId] — the editor's save */
export const SaveArticleSchema = z.object({
    title: z.string().trim().min(2, 'Give the article a title').max(200),
    summary: z.string().trim().max(500, 'Keep the summary under 500 characters').default(''),
    body: z.string().max(200000, 'The article is too long. Split it into several articles.').default(''),
    kind: z.enum(ARTICLE_KINDS),
    audience: z.enum(AUDIENCES),
    collectionId: z.string().uuid().nullable(),
    clientId: z.string().uuid().nullable(),
    productId: z.string().uuid().nullable(),
    tags: TagsSchema.default([]),
    /** The version the editor loaded; a save is refused if someone else saved since */
    expectedVersion: z.number().int().min(1).nullable().default(null),
})
export type SaveArticleInput = z.infer<typeof SaveArticleSchema>

/** POST /api/articles/[articleId]/status */
export const SetStatusSchema = z.object({ status: z.enum(PUBLISH_STATUSES) })
export type SetStatusInput = z.infer<typeof SetStatusSchema>

/** GET /api/articles */
export const ArticlesQuerySchema = z.object({
    q: z.string().trim().max(200).optional(),
    clientId: z.string().uuid().optional(),
    productId: z.string().uuid().optional(),
    collectionId: z.string().uuid().optional(),
    kind: z.enum(ARTICLE_KINDS).optional(),
    status: z.enum(PUBLISH_STATUSES).optional(),
    /** shared = knowledge for every client (no client) */
    scope: z.enum(['all', 'shared']).default('all'),
})
export type ArticlesQuery = z.infer<typeof ArticlesQuerySchema>
