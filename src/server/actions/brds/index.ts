import 'server-only'
import { supabaseAdmin } from '@/server/data/supabase/admin'
import { check, unwrap, unwrapMaybe } from '@/server/data/supabase/errors'
import { toJson } from '@/server/data/supabase/json'
import { recordAudit } from '@/server/actions/audit'
import { getProducts } from '@/server/actions/products'
import {
    BRD_SELECT,
    BRD_SUMMARY_SELECT,
    mapBrd,
    mapBrdSummary,
    mapQuestion,
    mapRule,
    parseAnswers,
    type BrdRow,
    type BrdSummaryRow,
} from './mappers'
import { buildBrd, customerArticles } from '@/utils/brd'
import { answersInScope, evaluateRules, visibleQuestions } from '@/utils/intakeRules'
import {
    BRD_ARTICLE_LIMIT,
    BRD_ASSETS_PER_KIND,
    BRD_BUILD_ASSET_KINDS,
    BRD_DESIGN_ASSET_KINDS,
} from '@/configs/brd.config'
import { NotFoundError } from '@/@types/errors'
import type { SessionUser } from '@/@types/auth/SessionUser'
import type { Brd, BrdsQuery, BrdSummary, GenerateBrdsInput, SaveBrdInput } from '@/@types/brds/Brd'
import type { BrdArticleLink, BrdAssetLink, BrdInput } from '@/@types/brds/BrdInput'
import type { IntakeRule } from '@/@types/intake/IntakeRule'

/*
 * BRDs: generated from a discovery intake (utils/brd.ts decides the content, published knowledge only),
 * then edited and finalised by the team. Every route checks `requirements.manage` first.
 * Regenerating overwrites the intake's draft BRDs; final BRDs are never overwritten.
 */

const notFound = () => new NotFoundError('That BRD doesn’t exist.', 'BRD_NOT_FOUND')

/** Longest body the database accepts */
const MAX_BODY = 200000

export async function getBrds(query: BrdsQuery = {}): Promise<BrdSummary[]> {
    let q = supabaseAdmin().from('brds').select(BRD_SUMMARY_SELECT).order('updated_at', { ascending: false }).limit(300)
    if (query.clientId) q = q.eq('client_id', query.clientId)
    if (query.intakeId) q = q.eq('intake_id', query.intakeId)
    if (query.audience) q = q.eq('audience', query.audience)
    return unwrap(await q, 'load BRDs').map((row) => mapBrdSummary(row as unknown as BrdSummaryRow))
}

async function loadBrd(brdId: string): Promise<Brd | null> {
    const row = unwrapMaybe(
        await supabaseAdmin().from('brds').select(BRD_SELECT).eq('id', brdId).maybeSingle(),
        'load the BRD',
    )
    return row ? mapBrd(row as unknown as BrdRow) : null
}

export async function getBrd(brdId: string): Promise<Brd> {
    const brd = await loadBrd(brdId)
    if (!brd) throw notFound()
    return brd
}

// ── Generation ────────────────────────────────────────────────────────────────────────────────────

/** A PostgREST filter: the client's own items, or shared items (no client) for the products in scope */
const scopeFilter = (clientId: string, productIds: string[]) =>
    productIds.length
        ? `client_id.eq.${clientId},and(client_id.is.null,product_id.in.(${productIds.join(',')}))`
        : `client_id.eq.${clientId}`

const unique = <T>(items: T[]) => [...new Set(items)]

/** Shared items or this client's: a rule may never pull another client's content into a BRD */
const visibleToClient = (row: { client_id: string | null }, clientId: string) =>
    row.client_id === null || row.client_id === clientId

/**
 * The published articles and assets a BRD links to: those the matched rules point to, then the
 * reference architectures, demo assets, scripts, flows, components and templates (and articles) for this
 * client and the products in scope — the client's own first, newest first, capped per kind.
 */
async function loadLinkedContent(clientId: string, productIds: string[], rules: IntakeRule[]) {
    const db = supabaseAdmin()
    const articleIds = unique(rules.flatMap((r) => r.articleIds))
    const assetIds = unique(rules.flatMap((r) => r.assetIds))
    const ARTICLE_COLUMNS = 'id, title, summary, audience, client_id'
    const ASSET_COLUMNS = 'id, title, summary, kind, url, client_id'

    const [linkedArticles, relatedArticles, linkedAssets, relatedAssets] = await Promise.all([
        articleIds.length
            ? db.from('articles').select(ARTICLE_COLUMNS).in('id', articleIds).eq('status', 'published')
            : null,
        db
            .from('articles')
            .select(ARTICLE_COLUMNS)
            .eq('status', 'published')
            .or(scopeFilter(clientId, productIds))
            .order('updated_at', { ascending: false })
            .limit(BRD_ARTICLE_LIMIT),
        assetIds.length
            ? db.from('library_assets').select(ASSET_COLUMNS).in('id', assetIds).eq('status', 'published')
            : null,
        db
            .from('library_assets')
            .select(ASSET_COLUMNS)
            .eq('status', 'published')
            .in('kind', [...BRD_DESIGN_ASSET_KINDS, ...BRD_BUILD_ASSET_KINDS])
            .or(scopeFilter(clientId, productIds))
            .order('updated_at', { ascending: false })
            .limit(200),
    ])

    const articleRows = [
        ...(linkedArticles ? unwrap(linkedArticles, 'load the linked articles') : []),
        ...unwrap(relatedArticles, 'load the client’s articles'),
    ].filter((row) => visibleToClient(row, clientId))
    const articles: BrdArticleLink[] = []
    for (const row of articleRows) {
        if (articles.some((a) => a.id === row.id)) continue
        // Rule links always stay; related articles fill up to the limit
        if (!articleIds.includes(row.id) && articles.length >= BRD_ARTICLE_LIMIT) continue
        articles.push({ id: row.id, title: row.title, summary: row.summary, audience: row.audience })
    }

    const linked = (linkedAssets ? unwrap(linkedAssets, 'load the linked assets') : []).filter((row) =>
        visibleToClient(row, clientId),
    )
    const related = unwrap(relatedAssets, 'load the library assets')
        .filter((row) => !assetIds.includes(row.id))
        // The client's own assets first (the query already orders by newest)
        .sort((a, b) => Number(b.client_id === clientId) - Number(a.client_id === clientId))
    const perKind = new Map<string, number>()
    const assets: BrdAssetLink[] = []
    for (const row of [...linked, ...related]) {
        if (assets.some((a) => a.id === row.id)) continue
        const count = perKind.get(row.kind) ?? 0
        if (!assetIds.includes(row.id) && count >= BRD_ASSETS_PER_KIND) continue
        perKind.set(row.kind, count + 1)
        assets.push({ id: row.id, title: row.title, summary: row.summary, kind: row.kind, url: row.url })
    }
    return { articles, assets }
}

/**
 * Builds the intake's BRDs (customer and/or internal). For each audience the intake's latest DRAFT is
 * overwritten (title, body, milestones); with no draft — or only final ones — a new draft is created.
 * `appUrl` is the request origin, used for links in the documents.
 */
export async function generateBrds(
    user: SessionUser,
    intakeId: string,
    input: GenerateBrdsInput,
    appUrl: string,
): Promise<BrdSummary[]> {
    const db = supabaseAdmin()
    const intake = unwrapMaybe(
        await db
            .from('intakes')
            .select('id, client_id, title, product_ids, answers, notes')
            .eq('id', intakeId)
            .maybeSingle(),
        'load the intake',
    )
    if (!intake) throw new NotFoundError('That intake doesn’t exist.', 'INTAKE_NOT_FOUND')

    const [client, allProducts, questionRows, ruleRows] = await Promise.all([
        db.from('clients').select('name, industry, summary').eq('id', intake.client_id).single(),
        getProducts(),
        db.from('intake_questions').select('*').eq('active', true).order('position'),
        db.from('intake_rules').select('*').eq('active', true).order('position'),
    ])
    const clientRow = unwrap(client, 'load the client')
    const products = allProducts.filter((p) => intake.product_ids.includes(p.id))
    const productIds = products.map((p) => p.id)
    const questions = visibleQuestions(unwrap(questionRows, 'load the questions').map(mapQuestion), productIds)
    const answers = answersInScope(questions, parseAnswers(intake.answers))
    const rules = evaluateRules(unwrap(ruleRows, 'load the rules').map(mapRule), answers, productIds)
    const { articles, assets } = await loadLinkedContent(intake.client_id, productIds, rules)

    const brdInput: BrdInput = {
        client: clientRow,
        intake: { title: intake.title, answers, notes: intake.notes },
        products,
        questions,
        rules,
        articles,
        assets,
        generatedAt: new Date(),
        appUrl,
    }

    const ids: string[] = []
    for (const audience of unique(input.audiences)) {
        // The customer document is built without internal articles at all (utils/brd filters again)
        const built = buildBrd(
            audience === 'customer' ? { ...brdInput, articles: customerArticles(articles) } : brdInput,
            audience,
        )
        const fields = {
            title: built.title,
            body: built.body.slice(0, MAX_BODY),
            milestones: toJson(built.milestones),
            updated_by: user.id,
        }
        const draft = unwrapMaybe(
            await db
                .from('brds')
                .select('id')
                .eq('intake_id', intakeId)
                .eq('audience', audience)
                .eq('status', 'draft')
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle(),
            'find the draft BRD',
        )
        let id: string
        if (draft) {
            check(await db.from('brds').update(fields).eq('id', draft.id), 'update the draft BRD')
            id = draft.id
        } else {
            id = unwrap(
                await db
                    .from('brds')
                    .insert({
                        ...fields,
                        client_id: intake.client_id,
                        intake_id: intakeId,
                        audience,
                        created_by: user.id,
                    })
                    .select('id')
                    .single(),
                'create the BRD',
            ).id
        }
        ids.push(id)
        await recordAudit(user.id, 'brd.generated', 'brd', id, {
            title: built.title,
            audience,
            intakeId,
            replacedDraft: !!draft,
            rules: rules.length,
        })
    }

    const saved = await getBrds({ intakeId })
    return ids.flatMap((id) => saved.filter((brd) => brd.id === id))
}

// ── Editing ───────────────────────────────────────────────────────────────────────────────────────

export async function saveBrd(user: SessionUser, brdId: string, input: SaveBrdInput): Promise<Brd> {
    const existing = await loadBrd(brdId)
    if (!existing) throw notFound()
    check(
        await supabaseAdmin()
            .from('brds')
            .update({
                title: input.title,
                status: input.status,
                body: input.body,
                milestones: toJson(input.milestones),
                updated_by: user.id,
            })
            .eq('id', brdId),
        'save the BRD',
    )
    if (existing.status !== 'final' && input.status === 'final') {
        await recordAudit(user.id, 'brd.finalized', 'brd', brdId, { title: input.title, audience: existing.audience })
    }
    return getBrd(brdId)
}

export async function deleteBrd(user: SessionUser, brdId: string) {
    const existing = await loadBrd(brdId)
    if (!existing) throw notFound()
    check(await supabaseAdmin().from('brds').delete().eq('id', brdId), 'delete the BRD')
    await recordAudit(user.id, 'brd.deleted', 'brd', brdId, {
        title: existing.title,
        audience: existing.audience,
        clientId: existing.clientId,
    })
}
