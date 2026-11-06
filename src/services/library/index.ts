import useSWR, { type SWRConfiguration } from 'swr'
import api from '@/services/api'
import { tryParseDate } from '@/utils/parse'
import type { Asset, AssetsQuery, AssetSummary, NewAssetInput, SaveAssetInput } from '@/@types/library/Asset'
import type { AssetEditorData } from '@/@types/library/AssetEditor'
import type { DiagramComponent, DiagramComponentInput } from '@/@types/library/DiagramComponent'

// ── Date revivers (JSON has strings) ──

export const ensureAssetSummary = <T extends AssetSummary>(a: T): T => ({
    ...a,
    updatedAt: tryParseDate(a.updatedAt) as Date,
})

export const ensureAsset = (a: Asset): Asset => ({
    ...ensureAssetSummary(a),
    createdAt: tryParseDate(a.createdAt) as Date,
})

const ensureEditor = (data: AssetEditorData): AssetEditorData => ({ ...data, asset: ensureAsset(data.asset) })

const toParams = (query: object) => {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) if (value) params.set(key, String(value))
    const s = params.toString()
    return s ? `?${s}` : ''
}

// ── Assets ──

export const getAssetsUrl = (query: Partial<AssetsQuery>) => `/assets${toParams(query)}`

export const apiGetAssets = async (query: Partial<AssetsQuery>) =>
    (await api.fetchJson<AssetSummary[]>({ method: 'get', url: getAssetsUrl(query) })).map(ensureAssetSummary)

export const useSWRAssets = (query: Partial<AssetsQuery> | null, config?: SWRConfiguration<AssetSummary[]>) =>
    useSWR(query ? getAssetsUrl(query) : null, () => apiGetAssets(query!), { keepPreviousData: true, ...config })

export const getAssetUrl = (assetId: string) => `/assets/${assetId}`

export const apiGetAsset = async (assetId: string) =>
    ensureAsset(await api.fetchJson<Asset>({ method: 'get', url: getAssetUrl(assetId) }))

export const useSWRAsset = (assetId: string | null, config?: SWRConfiguration<Asset>) =>
    useSWR(assetId ? getAssetUrl(assetId) : null, () => apiGetAsset(assetId!), config)

export const apiCreateAsset = async (input: NewAssetInput) =>
    ensureAsset(await api.fetchJson<Asset>({ method: 'post', url: '/assets', data: input }))

export const getAssetEditorUrl = (assetId: string) => `/assets/${assetId}/editor`

export const apiGetAssetEditor = async (assetId: string) =>
    ensureEditor(await api.fetchJson<AssetEditorData>({ method: 'get', url: getAssetEditorUrl(assetId) }))

export const useSWRAssetEditor = (assetId: string | null, config?: SWRConfiguration<AssetEditorData>) =>
    useSWR(assetId ? getAssetEditorUrl(assetId) : null, () => apiGetAssetEditor(assetId!), {
        // The editor owns its form state; don't reload it underneath the author
        revalidateOnFocus: false,
        ...config,
    })

/** Saves the editor's form, including the status (publish / unpublish / archive) */
export const apiSaveAsset = async (assetId: string, input: SaveAssetInput) =>
    ensureEditor(await api.fetchJson<AssetEditorData>({ method: 'put', url: getAssetUrl(assetId), data: input }))

export const apiDeleteAsset = (assetId: string) => api.fetchJson<void>({ method: 'delete', url: getAssetUrl(assetId) })

// ── Architecture diagram component types ──

export const diagramComponentsUrl = '/diagram-components'

export const apiGetDiagramComponents = () =>
    api.fetchJson<DiagramComponent[]>({ method: 'get', url: diagramComponentsUrl })

export const useSWRDiagramComponents = (config?: SWRConfiguration<DiagramComponent[]>) =>
    useSWR(diagramComponentsUrl, apiGetDiagramComponents, config)

export const apiCreateDiagramComponent = (input: DiagramComponentInput) =>
    api.fetchJson<DiagramComponent>({ method: 'post', url: diagramComponentsUrl, data: input })

export const apiUpdateDiagramComponent = (componentId: string, input: DiagramComponentInput) =>
    api.fetchJson<DiagramComponent>({ method: 'put', url: `${diagramComponentsUrl}/${componentId}`, data: input })

export const apiDeleteDiagramComponent = (componentId: string) =>
    api.fetchJson<void>({ method: 'delete', url: `${diagramComponentsUrl}/${componentId}` })
