import { parseTagsText, tagsToText } from '@/utils/tags'
import { CODE_LANGUAGES, type Asset, type SaveAssetInput } from '@/@types/library/Asset'
import type { AssetFormData } from '@/@types/library/forms/AssetFormData'
import type { PublishStatus } from '@/@types/shared/PublishStatusOptions'

/** Element ids the publish checklist jumps to */
export const ASSET_FIELD_IDS = { title: 'asset-title', summary: 'asset-summary', body: 'asset-body' } as const

const isCodeLanguage = (value: string): value is AssetFormData['codeLanguage'] =>
    (CODE_LANGUAGES as readonly string[]).includes(value)

export const toFormData = (asset: Asset): AssetFormData => ({
    title: asset.title,
    kind: asset.kind,
    summary: asset.summary,
    body: asset.body,
    url: asset.url,
    code: asset.code,
    codeLanguage: isCodeLanguage(asset.codeLanguage) ? asset.codeLanguage : '',
    clientId: asset.clientId ?? '',
    productId: asset.productId ?? '',
    tagsText: tagsToText(asset.tags),
    diagram: asset.diagram,
})

export const toSaveInput = (values: AssetFormData, status: PublishStatus): SaveAssetInput => ({
    title: values.title.trim(),
    kind: values.kind,
    summary: values.summary.trim(),
    body: values.body,
    url: values.url.trim(),
    code: values.code,
    codeLanguage: values.codeLanguage,
    clientId: values.clientId || null,
    productId: values.productId || null,
    tags: parseTagsText(values.tagsText),
    diagram: values.diagram,
    status,
})
