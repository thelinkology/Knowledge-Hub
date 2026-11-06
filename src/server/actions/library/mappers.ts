import 'server-only'
import { parseDiagram, type DiagramSummary } from '@/@types/library/Diagram'
import { summarizeDiagram } from '@/utils/diagram'
import type { Asset, AssetSummary } from '@/@types/library/Asset'
import type { Database } from '@/@types/supabase/database.types'

type Enums = Database['public']['Enums']

export const ASSET_SUMMARY_SELECT =
    'id, kind, title, summary, url, status, client_id, product_id, tags, updated_at, client:clients(name)'

export const ASSET_SELECT = `${ASSET_SUMMARY_SELECT}, body, code, code_language, diagram, created_at, creator:profiles!library_assets_created_by_fkey(display_name), updater:profiles!library_assets_updated_by_fkey(display_name)`

export interface AssetSummaryRow {
    id: string
    kind: Enums['asset_kind']
    title: string
    summary: string
    url: string
    status: Enums['publish_status']
    client_id: string | null
    product_id: string | null
    tags: string[]
    updated_at: string
    client: { name: string } | null
}

export interface AssetRow extends AssetSummaryRow {
    body: string
    code: string
    code_language: string
    diagram: unknown
    created_at: string
    creator: { display_name: string } | null
    updater: { display_name: string } | null
}

export const mapAssetSummary = (
    row: AssetSummaryRow,
    hasCode: boolean,
    diagramSummary: DiagramSummary | null = null,
): AssetSummary => ({
    id: row.id,
    kind: row.kind,
    title: row.title,
    summary: row.summary,
    url: row.url,
    status: row.status,
    clientId: row.client_id,
    clientName: row.client?.name ?? null,
    productId: row.product_id,
    tags: row.tags,
    hasCode,
    diagramSummary,
    updatedAt: new Date(row.updated_at),
})

export const mapAsset = (row: AssetRow): Asset => {
    const diagram = parseDiagram(row.diagram)
    return {
        ...mapAssetSummary(row, row.code.trim().length > 0, summarizeDiagram(diagram)),
        body: row.body,
        code: row.code,
        codeLanguage: row.code_language,
        diagram,
        createdByName: row.creator?.display_name ?? null,
        updatedByName: row.updater?.display_name ?? null,
        createdAt: new Date(row.created_at),
    }
}
