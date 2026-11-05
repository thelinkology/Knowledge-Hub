import type { ArticleSummary } from '@/@types/knowledge/Article'
import type { BrdSummary } from '@/@types/brds/Brd'
import type { ClientSummary } from '@/@types/clients/Client'

/** The home page */
export interface HomeOverview {
    counts: { articles: number; assets: number; clients: number; intakes: number; drafts: number }
    recentArticles: ArticleSummary[]
    recentClients: ClientSummary[]
    /** Editors only */
    recentBrds: BrdSummary[]
}
