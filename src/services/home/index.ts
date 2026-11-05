import useSWR, { type SWRConfiguration } from 'swr'
import api from '@/services/api'
import { ensureArticleSummary } from '@/services/knowledge'
import { tryParseDate } from '@/utils/parse'
import type { HomeOverview } from '@/@types/reports/Overview'

export const homeUrl = '/home'

/** Dates arrive as strings */
const ensureHome = (home: HomeOverview): HomeOverview => ({
    ...home,
    recentArticles: home.recentArticles.map(ensureArticleSummary),
    recentClients: home.recentClients.map((c) => ({ ...c, updatedAt: tryParseDate(c.updatedAt) as Date })),
    recentBrds: home.recentBrds.map((b) => ({ ...b, updatedAt: tryParseDate(b.updatedAt) as Date })),
})

export const apiGetHome = async () => ensureHome(await api.fetchJson<HomeOverview>({ method: 'get', url: homeUrl }))

export const useSWRHome = (config?: SWRConfiguration<HomeOverview>) => useSWR(homeUrl, apiGetHome, config)
