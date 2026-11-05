import { z } from 'zod'
import { NewArticleSchema, type NewArticleInput } from '@/@types/knowledge/Article'
import {
    CollectionSchema,
    type CollectionInput,
    type KnowledgeCollection,
} from '@/@types/knowledge/KnowledgeCollection'
import { ARTICLE_KINDS } from '@/@types/knowledge/ArticleKindOptions'

/*
 * Form schemas for the "New article" and collection dialogs. Pickers hold '' for "none" and become
 * null in the request; the server validates the request again (NewArticleSchema / CollectionSchema).
 */

export const NewArticleFormSchema = z.object({
    title: NewArticleSchema.shape.title,
    kind: z.enum(ARTICLE_KINDS),
    collectionId: z.string(),
    clientId: z.string(),
    productId: z.string(),
})
export type NewArticleFormData = z.infer<typeof NewArticleFormSchema>

export const toNewArticleInput = (values: NewArticleFormData): NewArticleInput => ({
    title: values.title.trim(),
    kind: values.kind,
    collectionId: values.collectionId || null,
    clientId: values.clientId || null,
    productId: values.productId || null,
})

export const CollectionFormSchema = z.object({
    title: CollectionSchema.shape.title,
    summary: z.string().trim().max(500, 'Keep the summary under 500 characters'),
    clientId: z.string(),
    productId: z.string(),
    status: z.enum(['draft', 'published', 'archived']),
})
export type CollectionFormData = z.infer<typeof CollectionFormSchema>

export const toCollectionFormData = (collection: KnowledgeCollection | null): CollectionFormData => ({
    title: collection?.title ?? '',
    summary: collection?.summary ?? '',
    clientId: collection?.clientId ?? '',
    productId: collection?.productId ?? '',
    status: collection?.status ?? 'draft',
})

export const toCollectionInput = (values: CollectionFormData): CollectionInput => ({
    title: values.title.trim(),
    summary: values.summary.trim(),
    clientId: values.clientId || null,
    productId: values.productId || null,
    status: values.status,
})
