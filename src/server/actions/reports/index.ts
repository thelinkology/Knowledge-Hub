import 'server-only'
import { supabaseAdmin } from '@/server/data/supabase/admin'
import { check, unwrap } from '@/server/data/supabase/errors'
import { getClients } from '@/server/actions/clients'
import { canEdit } from '@/server/actions/knowledge'
import { ARTICLE_SUMMARY_SELECT, mapArticleSummary, type ArticleSummaryRow } from '@/server/actions/knowledge/mappers'
import { hasPermission } from '@/@types/auth/Roles'
import type { SessionUser } from '@/@types/auth/SessionUser'
import type { HomeOverview } from '@/@types/reports/Overview'
import type { BrdStatus, BrdSummary } from '@/@types/brds/Brd'
import type { Audience } from '@/@types/shared/PublishStatusOptions'

/*
 * Reports: the home page overview. Viewers only get published knowledge and the client list; editors
 * also see drafts, discovery intakes and recent BRDs (editor-only data).
 */

const RECENT_ARTICLES = 6
const RECENT_CLIENTS = 6
const RECENT_BRDS = 5

type CountedTable = 'articles' | 'library_assets' | 'clients' | 'intakes'

/** Number of rows (optionally with one status); `head: true` returns no rows, only the count */
async function countRows(table: CountedTable, status?: 'published' | 'draft') {
    let query = supabaseAdmin().from(table).select('id', { count: 'exact', head: true })
    if (status && (table === 'articles' || table === 'library_assets')) query = query.eq('status', status)
    const result = await query
    check(result, 'count what’s in the hub')
    return result.count ?? 0
}

interface BrdRow {
    id: string
    title: string
    audience: Audience
    status: BrdStatus
    client_id: string
    intake_id: string | null
    updated_at: string
    client: { name: string } | null
    intake: { title: string } | null
}

const mapBrdSummary = (row: BrdRow): BrdSummary => ({
    id: row.id,
    title: row.title,
    audience: row.audience,
    status: row.status,
    clientId: row.client_id,
    clientName: row.client?.name ?? '',
    intakeId: row.intake_id,
    intakeTitle: row.intake?.title ?? null,
    updatedAt: new Date(row.updated_at),
})

async function getRecentArticles(user: SessionUser) {
    let query = supabaseAdmin().from('articles').select(ARTICLE_SUMMARY_SELECT).limit(RECENT_ARTICLES)
    // Editors: what the team worked on last (drafts included). Viewers: what was published last.
    query = canEdit(user)
        ? query.neq('status', 'archived').order('updated_at', { ascending: false })
        : query.eq('status', 'published').order('published_at', { ascending: false, nullsFirst: false })
    return unwrap(await query, 'load recent articles').map((row) =>
        mapArticleSummary(row as unknown as ArticleSummaryRow),
    )
}

async function getRecentBrds(): Promise<BrdSummary[]> {
    const rows = unwrap(
        await supabaseAdmin()
            .from('brds')
            .select(
                'id, title, audience, status, client_id, intake_id, updated_at, client:clients(name), intake:intakes(title)',
            )
            .order('updated_at', { ascending: false })
            .limit(RECENT_BRDS),
        'load recent BRDs',
    )
    return rows.map((row) => mapBrdSummary(row as unknown as BrdRow))
}

async function getRecentClients() {
    const clients = await getClients()
    return [...clients].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, RECENT_CLIENTS)
}

export async function getHomeOverview(user: SessionUser): Promise<HomeOverview> {
    const editor = canEdit(user)
    const requirements = hasPermission(user.role, 'requirements.manage')
    const [articles, assets, clients, intakes, drafts, recentArticles, recentClients, recentBrds] = await Promise.all([
        countRows('articles', 'published'),
        countRows('library_assets', 'published'),
        countRows('clients'),
        requirements ? countRows('intakes') : Promise.resolve(0),
        editor ? countRows('articles', 'draft') : Promise.resolve(0),
        getRecentArticles(user),
        getRecentClients(),
        requirements ? getRecentBrds() : Promise.resolve([]),
    ])
    return {
        counts: { articles, assets, clients, intakes, drafts },
        recentArticles,
        recentClients,
        recentBrds,
    }
}
