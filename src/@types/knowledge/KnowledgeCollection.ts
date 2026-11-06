import { z } from 'zod'
import type { PublishStatus } from '@/@types/shared/PublishStatusOptions'

/** A group of articles read in order (like a Microsoft Learn module) */
export interface KnowledgeCollection {
    id: string
    title: string
    summary: string
    status: PublishStatus
    clientId: string | null
    clientName: string | null
    productId: string | null
    position: number
    articleCount: number
    updatedAt: Date
}

/** POST /api/collections, PUT /api/collections/[collectionId] */
export const CollectionSchema = z.object({
    title: z.string().trim().min(2, 'Give the collection a title').max(150),
    summary: z.string().trim().max(500).default(''),
    clientId: z.string().uuid().nullable().default(null),
    productId: z.string().uuid().nullable().default(null),
    status: z.enum(['draft', 'published', 'archived']).default('draft'),
})
export type CollectionInput = z.infer<typeof CollectionSchema>

/** PUT /api/collections/[collectionId]/tree — where each article sits (parent and position among its siblings) */
export const ArrangeCollectionSchema = z.object({
    items: z
        .array(
            z.object({
                id: z.string().uuid(),
                parentId: z.string().uuid().nullable(),
                position: z.number().int().min(0).max(10000),
            }),
        )
        .min(1)
        .max(500),
})
export type ArrangeCollectionInput = z.infer<typeof ArrangeCollectionSchema>
