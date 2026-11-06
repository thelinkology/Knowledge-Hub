import { z } from 'zod'
import { ARTICLE_KINDS } from '@/@types/knowledge/ArticleKindOptions'
import { AUDIENCES } from '@/@types/shared/PublishStatusOptions'
import { parseTagsText } from '@/utils/tags'

/**
 * The article editor's form. Pickers hold '' for "none"; tags are typed as comma-separated text.
 * (The server validates SaveArticleSchema again — this is UX.)
 */
export const ArticleFormSchema = z.object({
    title: z.string().trim().min(2, 'Give the article a title').max(200),
    summary: z.string().trim().max(500, 'Keep the summary under 500 characters'),
    body: z.string().max(200000, 'The article is too long. Split it into several articles.'),
    kind: z.enum(ARTICLE_KINDS),
    audience: z.enum(AUDIENCES),
    collectionId: z.string(),
    /** '' = top level of the collection */
    parentId: z.string(),
    clientId: z.string(),
    productId: z.string(),
    tagsText: z
        .string()
        .max(1000)
        .refine((text) => parseTagsText(text).length <= 20, 'Use up to 20 tags'),
})
export type ArticleFormData = z.infer<typeof ArticleFormSchema>
