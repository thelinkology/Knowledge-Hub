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

/** PUT /api/collections/[collectionId]/order */
export const ReorderSchema = z.object({ ids: z.array(z.string().uuid()).min(1).max(500) })
export type ReorderInput = z.infer<typeof ReorderSchema>
