import useSWR, { mutate, type SWRConfiguration } from 'swr'
import api from '@/services/api'
import { tryParseDate } from '@/utils/parse'
import type { Brd, BrdsQuery, BrdSummary, GenerateBrdsInput, SaveBrdInput } from '@/@types/brds/Brd'

// ── Date revivers (JSON has strings) ──

export const ensureBrdSummary = <T extends BrdSummary>(b: T): T => ({
    ...b,
    updatedAt: tryParseDate(b.updatedAt) as Date,
})

export const ensureBrd = (b: Brd): Brd => ({ ...ensureBrdSummary(b), createdAt: tryParseDate(b.createdAt) as Date })

const toParams = (query: object) => {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) if (value) params.set(key, String(value))
    const s = params.toString()
    return s ? `?${s}` : ''
}

// ── BRDs ──

export const getBrdsUrl = (query: Partial<BrdsQuery> = {}) => `/brds${toParams(query)}`

export const apiGetBrds = async (query: Partial<BrdsQuery> = {}) =>
    (await api.fetchJson<BrdSummary[]>({ method: 'get', url: getBrdsUrl(query) })).map(ensureBrdSummary)

export const useSWRBrds = (query: Partial<BrdsQuery> | null, config?: SWRConfiguration<BrdSummary[]>) =>
    useSWR(query ? getBrdsUrl(query) : null, () => apiGetBrds(query!), { keepPreviousData: true, ...config })

/** Re-fetches every BRD list on screen (after BRDs were generated, saved or deleted) */
export const revalidateBrdLists = () =>
    mutate((key) => typeof key === 'string' && (key === '/brds' || key.startsWith('/brds?')))

export const getBrdUrl = (brdId: string) => `/brds/${brdId}`

export const apiGetBrd = async (brdId: string) =>
    ensureBrd(await api.fetchJson<Brd>({ method: 'get', url: getBrdUrl(brdId) }))

export const useSWRBrd = (brdId: string | null, config?: SWRConfiguration<Brd>) =>
    useSWR(brdId ? getBrdUrl(brdId) : null, () => apiGetBrd(brdId!), config)

export const apiSaveBrd = async (brdId: string, input: SaveBrdInput) => {
    const brd = await api.fetchJson<Brd>({ method: 'put', url: getBrdUrl(brdId), data: input })
    void revalidateBrdLists()
    return ensureBrd(brd)
}

export const apiDeleteBrd = async (brdId: string) => {
    await api.fetchJson<void>({ method: 'delete', url: getBrdUrl(brdId) })
    void revalidateBrdLists()
}

/** Builds the intake's BRDs; its draft BRDs are overwritten, final ones kept */
export const apiGenerateBrds = async (intakeId: string, input: GenerateBrdsInput): Promise<BrdSummary[]> => {
    const brds = await api.fetchJson<BrdSummary[]>({
        method: 'post',
        url: `/intakes/${intakeId}/brds`,
        data: input,
        // Generation reads the whole intake configuration and library
        timeout: 60_000,
    })
    void revalidateBrdLists()
    return brds.map(ensureBrdSummary)
}
