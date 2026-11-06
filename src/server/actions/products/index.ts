import 'server-only'
import { cache } from 'react'
import { supabaseAdmin } from '@/server/data/supabase/admin'
import { toAppError, unwrap, unwrapMaybe } from '@/server/data/supabase/errors'
import { asArray, toJson } from '@/server/data/supabase/json'
import { recordAudit } from '@/server/actions/audit'
import { ConflictError, NotFoundError } from '@/@types/errors'
import { MilestoneSchema, type Milestone } from '@/@types/brds/Milestone'
import { isProductTheme } from '@/@types/products/ProductThemeOptions'
import type { Product, ProductInput } from '@/@types/products/Product'
import type { SessionUser } from '@/@types/auth/SessionUser'
import type { Tables } from '@/@types/supabase/database.types'

/** Stored milestones are re-validated on the way out, so a hand-edited row can't break a BRD */
export const parseMilestones = (value: unknown): Milestone[] =>
    asArray(value).flatMap((m) => {
        const parsed = MilestoneSchema.safeParse(m)
        return parsed.success ? [parsed.data] : []
    })

export const mapProduct = (row: Tables<'products'>): Product => ({
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    theme: isProductTheme(row.theme) ? row.theme : 'slate',
    logoUrl: row.logo_url,
    milestoneTemplate: parseMilestones(row.milestone_template),
    active: row.active,
    sortOrder: row.sort_order,
})

/** Every product (inactive ones too: old content still refers to them). Cached per request. */
export const getProducts = cache(async (): Promise<Product[]> =>
    unwrap(
        await supabaseAdmin().from('products').select('*').order('sort_order').order('name'),
        'load the products',
    ).map(mapProduct),
)

const toRow = (input: ProductInput) => ({
    code: input.code,
    name: input.name,
    description: input.description,
    theme: input.theme,
    logo_url: input.logoUrl,
    milestone_template: toJson(input.milestoneTemplate),
    active: input.active,
    sort_order: input.sortOrder,
})

export async function createProduct(admin: SessionUser, input: ProductInput): Promise<Product> {
    const result = await supabaseAdmin().from('products').insert(toRow(input)).select('*').single()
    if (result.error?.code === '23505') throw new ConflictError('Another product already uses that code.', 'DUPLICATE')
    const product = mapProduct(unwrap(result, 'create the product'))
    await recordAudit(admin.id, 'product.created', 'product', product.id, { name: product.name })
    return product
}

export async function updateProduct(admin: SessionUser, productId: string, input: ProductInput): Promise<Product> {
    const result = await supabaseAdmin()
        .from('products')
        .update(toRow(input))
        .eq('id', productId)
        .select('*')
        .maybeSingle()
    if (result.error?.code === '23505') throw new ConflictError('Another product already uses that code.', 'DUPLICATE')
    if (result.error) throw toAppError(result.error, 'save the product')
    const row = unwrapMaybe(result, 'save the product')
    if (!row) throw new NotFoundError('That product doesn’t exist.', 'PRODUCT_NOT_FOUND')
    await recordAudit(admin.id, 'product.updated', 'product', productId, { name: row.name })
    return mapProduct(row)
}

/** Ids that aren't real products are dropped (a stale picker can't attach unknown ids) */
export async function knownProductIds(ids: string[]): Promise<string[]> {
    if (!ids.length) return []
    const known = new Set((await getProducts()).map((p) => p.id))
    return [...new Set(ids)].filter((id) => known.has(id))
}
