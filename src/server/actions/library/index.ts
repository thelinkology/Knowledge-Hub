import 'server-only'
import { supabaseAdmin } from '@/server/data/supabase/admin'
import { check, unwrap, unwrapMaybe } from '@/server/data/supabase/errors'
import { recordAudit } from '@/server/actions/audit'
import { assertClientExists, getClientOptions } from '@/server/actions/clients'
import { getProducts, knownProductIds } from '@/server/actions/products'
import {
    ASSET_SELECT,
    ASSET_SUMMARY_SELECT,
    mapAsset,
    mapAssetSummary,
    type AssetRow,
    type AssetSummaryRow,
} from './mappers'
import { getPublishIssues } from '@/utils/articleValidation'
import { summarizeDiagram } from '@/utils/diagram'
import { parseDiagram, type DiagramSummary } from '@/@types/library/Diagram'
import { ConflictError, DataError, NotFoundError } from '@/@types/errors'
import { hasPermission } from '@/@types/auth/Roles'
import type { SessionUser } from '@/@types/auth/SessionUser'
import type { Asset, AssetsQuery, AssetSummary, NewAssetInput, SaveAssetInput } from '@/@types/library/Asset'
import type { AssetEditorData } from '@/@types/library/AssetEditor'

/*
 * The library: reusable assets (scripts, reference architectures with their diagrams, demo assets,
 * components, templates). Viewers only ever get published assets; editors also see drafts (and archived ones when
 * they ask for them). Writes are made by editors (the routes check `knowledge.manage`) after the checks here.
 */

const canEdit = (user: SessionUser) => hasPermission(user.role, 'knowledge.manage')

const notFound = () => new NotFoundError('That asset doesn’t exist (or isn’t published yet).', 'ASSET_NOT_FOUND')

/** Ids per request when filtering by id (keeps the query string short) */
const ID_BATCH = 100

/** Which of these assets have a code snippet (without loading every snippet) */
async function idsWithCode(ids: string[]): Promise<Set<string>> {
    const batches: string[][] = []
    for (let i = 0; i < ids.length; i += ID_BATCH) batches.push(ids.slice(i, i + ID_BATCH))
    const results = await Promise.all(
        batches.map(async (batch) =>
            unwrap(
                await supabaseAdmin().from('library_assets').select('id').in('id', batch).neq('code', ''),
                'load the library',
            ),
        ),
    )
    return new Set(results.flat().map((r) => r.id))
}

/**
 * "N views · M components" for the reference architectures among these assets. Only their diagrams are
 * loaded (in id batches), and only as many as one library page shows.
 */
async function diagramSummaries(ids: string[]): Promise<Map<string, DiagramSummary>> {
    const batches: string[][] = []
    for (let i = 0; i < ids.length; i += ID_BATCH) batches.push(ids.slice(i, i + ID_BATCH))
    const results = await Promise.all(
        batches.map(async (batch) =>
            unwrap(
                await supabaseAdmin()
                    .from('library_assets')
                    .select('id, diagram')
                    .in('id', batch)
                    .eq('kind', 'reference_architecture'),
                'load the library',
            ),
        ),
    )
    const summaries = new Map<string, DiagramSummary>()
    for (const row of results.flat()) {
        const summary = summarizeDiagram(parseDiagram(row.diagram))
        if (summary) summaries.set(row.id, summary)
    }
    return summaries
}

export async function getAssets(user: SessionUser, query: AssetsQuery): Promise<AssetSummary[]> {
    let q = supabaseAdmin()
        .from('library_assets')
        .select(ASSET_SUMMARY_SELECT)
        .order('updated_at', { ascending: false })
        .limit(300)
    if (!canEdit(user)) q = q.eq('status', 'published')
    else if (query.status) q = q.eq('status', query.status)
    else q = q.neq('status', 'archived')
    if (query.kind) q = q.eq('kind', query.kind)
    if (query.clientId) q = q.eq('client_id', query.clientId)
    if (query.productId) q = q.eq('product_id', query.productId)
    if (query.q) {
        const term = query.q.replace(/[%_,()\\]/g, ' ').trim()
        if (term) q = q.or(`title.ilike.%${term}%,summary.ilike.%${term}%`)
    }
    const rows = unwrap(await q, 'load the library') as unknown as AssetSummaryRow[]
    const [withCode, diagrams] = await Promise.all([
        idsWithCode(rows.map((r) => r.id)),
        diagramSummaries(rows.filter((r) => r.kind === 'reference_architecture').map((r) => r.id)),
    ])
    return rows.map((row) => mapAssetSummary(row, withCode.has(row.id), diagrams.get(row.id) ?? null))
}

async function loadAsset(assetId: string): Promise<Asset | null> {
    const row = unwrapMaybe(
        await supabaseAdmin().from('library_assets').select(ASSET_SELECT).eq('id', assetId).maybeSingle(),
        'load the asset',
    )
    return row ? mapAsset(row as unknown as AssetRow) : null
}

/** One asset. Viewers get 404 for anything unpublished, so drafts can't be probed. */
export async function getAsset(user: SessionUser, assetId: string): Promise<Asset> {
    const asset = await loadAsset(assetId)
    if (!asset || (!canEdit(user) && asset.status !== 'published')) throw notFound()
    return asset
}

/** Everything the editor needs: the asset plus the choices for its pickers */
export async function getAssetEditor(assetId: string): Promise<AssetEditorData> {
    const asset = await loadAsset(assetId)
    if (!asset) throw notFound()
    const [clients, products] = await Promise.all([getClientOptions(), getProducts()])
    return { asset, clients, products }
}

/** Checks the pickers' ids: the client and product must exist */
async function checkPlacement(input: { clientId: string | null; productId: string | null }) {
    await assertClientExists(input.clientId)
    if (input.productId && !(await knownProductIds([input.productId])).length) {
        throw new DataError('That product doesn’t exist.', 'PRODUCT_NOT_FOUND')
    }
}

export async function createAsset(user: SessionUser, input: NewAssetInput): Promise<Asset> {
    await checkPlacement(input)
    const inserted = unwrap(
        await supabaseAdmin()
            .from('library_assets')
            .insert({
                title: input.title,
                kind: input.kind,
                client_id: input.clientId,
                product_id: input.productId,
                created_by: user.id,
                updated_by: user.id,
            })
            .select('id')
            .single(),
        'create the asset',
    )
    return (await loadAsset(inserted.id)) as Asset
}

/**
 * The editor's save, which also sets the status (publish, unpublish, archive). Publishing — or saving
 * an asset that stays published — requires the same checklist the editor shows.
 */
export async function saveAsset(user: SessionUser, assetId: string, input: SaveAssetInput): Promise<AssetEditorData> {
    const existing = await loadAsset(assetId)
    if (!existing) throw notFound()
    await checkPlacement(input)
    if (input.status === 'published') {
        const issues = getPublishIssues(input)
        if (issues.length) {
            throw new ConflictError(
                existing.status === 'published'
                    ? `This asset is published, so it must stay complete: ${issues[0].message}`
                    : `Can’t publish yet: ${issues[0].message}`,
                'NOT_READY',
            )
        }
    }
    check(
        await supabaseAdmin()
            .from('library_assets')
            .update({
                title: input.title,
                kind: input.kind,
                summary: input.summary,
                body: input.body,
                url: input.url,
                code: input.code,
                code_language: input.codeLanguage,
                client_id: input.clientId,
                product_id: input.productId,
                tags: input.tags,
                diagram: input.diagram,
                status: input.status,
                updated_by: user.id,
            })
            .eq('id', assetId),
        'save the asset',
    )
    if (input.status !== existing.status) {
        await recordAudit(user.id, `asset.${input.status}`, 'asset', assetId, { title: input.title })
    }
    return getAssetEditor(assetId)
}

export async function deleteAsset(user: SessionUser, assetId: string) {
    const asset = await loadAsset(assetId)
    if (!asset) throw notFound()
    check(await supabaseAdmin().from('library_assets').delete().eq('id', assetId), 'delete the asset')
    await recordAudit(user.id, 'asset.deleted', 'asset', assetId, { title: asset.title })
}
