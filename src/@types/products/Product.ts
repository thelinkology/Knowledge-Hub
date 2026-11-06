import { z } from 'zod'
import { MilestoneSchema, type Milestone } from '@/@types/brds/Milestone'
import { PRODUCT_THEMES, type ProductTheme } from './ProductThemeOptions'

/** A product or platform the team delivers (Acterys, BPP, Fabric …). Admin-configurable. */
export interface Product {
    id: string
    code: string
    name: string
    description: string
    theme: ProductTheme
    /** Uploaded logo (/api/media/<id>) or an https link; empty = a monogram tile in the product colour */
    logoUrl: string
    /** Milestones added to a BRD when this product is in scope */
    milestoneTemplate: Milestone[]
    active: boolean
    sortOrder: number
}

/** POST /api/admin/products, PUT /api/admin/products/[productId] */
export const ProductSchema = z.object({
    code: z
        .string()
        .trim()
        .toLowerCase()
        .regex(/^[a-z0-9-]{2,40}$/, 'Use 2–40 lower-case letters, digits or dashes'),
    name: z.string().trim().min(2, 'Give the product a name').max(60),
    description: z.string().trim().max(500).default(''),
    theme: z.enum(PRODUCT_THEMES).default('blue'),
    logoUrl: z
        .string()
        .trim()
        .max(500)
        .refine(
            (url) => url === '' || /^https:\/\/\S+$/i.test(url) || /^\/api\/media\/[0-9a-f-]{36}$/.test(url),
            'Upload an image or use a full https:// link',
        )
        .default(''),
    milestoneTemplate: z.array(MilestoneSchema).max(20).default([]),
    active: z.boolean().default(true),
    sortOrder: z.number().int().min(0).max(1000).default(0),
})
export type ProductInput = z.infer<typeof ProductSchema>
