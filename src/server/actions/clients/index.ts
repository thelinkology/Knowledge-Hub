import 'server-only'
import { supabaseAdmin } from '@/server/data/supabase/admin'
import { check, unwrap, unwrapMaybe } from '@/server/data/supabase/errors'
import { recordAudit } from '@/server/actions/audit'
import { knownProductIds } from '@/server/actions/products'
import { DataError, NotFoundError } from '@/@types/errors'
import { hasPermission } from '@/@types/auth/Roles'
import { slugify } from '@/utils/slugs'
import type { SessionUser } from '@/@types/auth/SessionUser'
import type { Client, ClientInput, ClientOption, ClientsQuery, ClientSummary } from '@/@types/clients/Client'

const SUMMARY_SELECT =
    'id, name, slug, industry, summary, status, product_ids, updated_at, owner:profiles!clients_owner_id_fkey(display_name)'

type SummaryRow = {
    id: string
    name: string
    slug: string
    industry: string
    summary: string
    status: ClientSummary['status']
    product_ids: string[]
    updated_at: string
    owner: { display_name: string } | null
}

const mapSummary = (row: SummaryRow): ClientSummary => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    industry: row.industry,
    summary: row.summary,
    status: row.status,
    productIds: row.product_ids,
    ownerName: row.owner?.display_name ?? null,
    updatedAt: new Date(row.updated_at),
})

export async function getClients({ q, status }: ClientsQuery = {}): Promise<ClientSummary[]> {
    let query = supabaseAdmin().from('clients').select(SUMMARY_SELECT).order('name').limit(1000)
    if (status) query = query.eq('status', status)
    if (q) {
        const term = q.replace(/[%_,()\\]/g, ' ').trim()
        if (term) query = query.or(`name.ilike.%${term}%,industry.ilike.%${term}%,summary.ilike.%${term}%`)
    }
    return unwrap(await query, 'load clients').map((row) => mapSummary(row as SummaryRow))
}

/** Names for pickers */
export async function getClientOptions(): Promise<ClientOption[]> {
    return unwrap(await supabaseAdmin().from('clients').select('id, name').order('name').limit(1000), 'load clients')
}

export async function findClient(clientId: string) {
    return unwrapMaybe(
        await supabaseAdmin().from('clients').select('id, name').eq('id', clientId).maybeSingle(),
        'find the client',
    )
}

/** Throws a 400 when a form refers to a client that doesn't exist */
export async function assertClientExists(clientId: string | null) {
    if (clientId && !(await findClient(clientId))) throw new DataError('That client doesn’t exist.', 'CLIENT_NOT_FOUND')
}

const count = async (table: 'articles' | 'library_assets', clientId: string, publishedOnly: boolean) => {
    let query = supabaseAdmin().from(table).select('id', { count: 'exact', head: true }).eq('client_id', clientId)
    query = publishedOnly ? query.eq('status', 'published') : query.neq('status', 'archived')
    return (await query).count ?? 0
}

const countWork = async (table: 'intakes' | 'brds', clientId: string) =>
    (await supabaseAdmin().from(table).select('id', { count: 'exact', head: true }).eq('client_id', clientId)).count ??
    0

/** The client with counts. Viewers' counts include only what they can open (published knowledge, no requirements). */
export async function getClient(clientId: string, viewer?: SessionUser): Promise<Client> {
    const publishedOnly = !!viewer && !hasPermission(viewer.role, 'knowledge.manage')
    const seesRequirements = !viewer || hasPermission(viewer.role, 'requirements.manage')
    const row = unwrapMaybe(
        await supabaseAdmin()
            .from('clients')
            .select(`${SUMMARY_SELECT}, website, notes, owner_id, created_at`)
            .eq('id', clientId)
            .maybeSingle(),
        'load the client',
    )
    if (!row) throw new NotFoundError('That client doesn’t exist.', 'CLIENT_NOT_FOUND')
    const [articles, assets, intakes, brds] = await Promise.all([
        count('articles', clientId, publishedOnly),
        count('library_assets', clientId, publishedOnly),
        seesRequirements ? countWork('intakes', clientId) : 0,
        seesRequirements ? countWork('brds', clientId) : 0,
    ])
    return {
        ...mapSummary(row as SummaryRow),
        website: row.website,
        notes: row.notes,
        ownerId: row.owner_id,
        createdAt: new Date(row.created_at),
        counts: { articles, assets, intakes, brds },
    }
}

/** A unique slug: "contoso", then "contoso-2", … */
async function uniqueSlug(name: string, exceptId?: string) {
    // Room for a "-NN" suffix within the 80-character limit; at least 2 characters
    const slug = slugify(name).slice(0, 74).replace(/-+$/, '')
    const base = slug.length >= 2 ? slug : `client-${slug || 'x'}`
    const rows = unwrap(
        await supabaseAdmin().from('clients').select('id, slug').like('slug', `${base}%`).limit(1000),
        'check the name',
    )
    const taken = new Set(rows.filter((r) => r.id !== exceptId).map((r) => r.slug))
    if (!taken.has(base)) return base
    for (let n = 2; ; n++) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`
}

async function toRow(input: ClientInput) {
    if (input.ownerId) {
        const owner = unwrapMaybe(
            await supabaseAdmin().from('profiles').select('id').eq('id', input.ownerId).maybeSingle(),
            'find the owner',
        )
        if (!owner) throw new DataError('That owner doesn’t exist.', 'OWNER_NOT_FOUND')
    }
    return {
        name: input.name,
        industry: input.industry,
        website: input.website,
        summary: input.summary,
        notes: input.notes,
        status: input.status,
        product_ids: await knownProductIds(input.productIds),
        owner_id: input.ownerId,
    }
}

export async function createClient(user: SessionUser, input: ClientInput): Promise<Client> {
    const inserted = unwrap(
        await supabaseAdmin()
            .from('clients')
            .insert({ ...(await toRow(input)), slug: await uniqueSlug(input.name), created_by: user.id })
            .select('id')
            .single(),
        'create the client',
    )
    await recordAudit(user.id, 'client.created', 'client', inserted.id, { name: input.name })
    return getClient(inserted.id)
}

export async function updateClient(user: SessionUser, clientId: string, input: ClientInput): Promise<Client> {
    const existing = await findClient(clientId)
    if (!existing) throw new NotFoundError('That client doesn’t exist.', 'CLIENT_NOT_FOUND')
    const row = await toRow(input)
    const slug = existing.name === input.name ? undefined : await uniqueSlug(input.name, clientId)
    check(
        await supabaseAdmin()
            .from('clients')
            .update(slug ? { ...row, slug } : row)
            .eq('id', clientId),
        'save the client',
    )
    return getClient(clientId)
}

/** Deletes the client and everything that belongs only to them (their articles, assets, intakes, BRDs) */
export async function deleteClient(user: SessionUser, clientId: string) {
    const existing = await findClient(clientId)
    if (!existing) throw new NotFoundError('That client doesn’t exist.', 'CLIENT_NOT_FOUND')
    check(await supabaseAdmin().from('clients').delete().eq('id', clientId), 'delete the client')
    await recordAudit(user.id, 'client.deleted', 'client', clientId, { name: existing.name })
}
