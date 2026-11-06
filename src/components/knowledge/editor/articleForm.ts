import { parseTagsText, tagsToText } from '@/utils/tags'
import type { Article, SaveArticleInput } from '@/@types/knowledge/Article'
import type { ArticleFormData } from '@/@types/knowledge/forms/ArticleFormData'

/** Element ids the publish checklist jumps to */
export const ARTICLE_FIELD_IDS = { title: 'article-title', summary: 'article-summary', body: 'article-body' } as const

export const toFormData = (article: Article): ArticleFormData => ({
    title: article.title,
    summary: article.summary,
    body: article.body,
    kind: article.kind,
    audience: article.audience,
    collectionId: article.collectionId ?? '',
    parentId: article.parentId ?? '',
    clientId: article.clientId ?? '',
    productId: article.productId ?? '',
    tagsText: tagsToText(article.tags),
})

export const toSaveInput = (values: ArticleFormData, expectedVersion: number): SaveArticleInput => ({
    title: values.title.trim(),
    summary: values.summary.trim(),
    body: values.body,
    kind: values.kind,
    audience: values.audience,
    collectionId: values.collectionId || null,
    parentId: (values.collectionId && values.parentId) || null,
    clientId: values.clientId || null,
    productId: values.productId || null,
    tags: parseTagsText(values.tagsText),
    expectedVersion,
})
