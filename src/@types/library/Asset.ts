import { z } from 'zod'
import { TagsSchema } from '@/@types/knowledge/Article'
import { PUBLISH_STATUSES, type PublishStatus } from '@/@types/shared/PublishStatusOptions'
import type { NavigationIconKey } from '@/configs/icons.config'

/** What a library item is. Reference architectures and demo assets feed straight into BRDs. */
export const ASSET_KINDS = ['script', 'flow', 'reference_architecture', 'demo_asset', 'component', 'template'] as const
export type AssetKind = (typeof ASSET_KINDS)[number]

export const assetKindLabel: Record<AssetKind, string> = {
    script: 'Script',
    flow: 'Flow',
    reference_architecture: 'Reference architecture',
    demo_asset: 'Demo asset',
    component: 'Component',
    template: 'Template',
}

export const assetKindPlural: Record<AssetKind, string> = {
    script: 'Scripts',
    flow: 'Flows',
    reference_architecture: 'Reference architectures',
    demo_asset: 'Demo assets',
    component: 'Components',
    template: 'Templates',
}

export const assetKindIcon: Record<AssetKind, NavigationIconKey> = {
    script: 'script',
    flow: 'flow',
    reference_architecture: 'architecture',
    demo_asset: 'demo',
    component: 'component',
    template: 'template',
}

/** Languages offered for code snippets (shown as a label; code is never executed) */
export const CODE_LANGUAGES = [
    '',
    'sql',
    'dax',
    'm',
    'python',
    'powershell',
    'json',
    'yaml',
    'csharp',
    'javascript',
] as const
export const codeLanguageLabel: Record<string, string> = {
    '': 'None',
    sql: 'SQL',
    dax: 'DAX',
    m: 'Power Query (M)',
    python: 'Python',
    powershell: 'PowerShell',
    json: 'JSON',
    yaml: 'YAML',
    csharp: 'C#',
    javascript: 'JavaScript',
}

export interface AssetSummary {
    id: string
    kind: AssetKind
    title: string
    summary: string
    url: string
    status: PublishStatus
    clientId: string | null
    clientName: string | null
    productId: string | null
    tags: string[]
    hasCode: boolean
    updatedAt: Date
}

export interface Asset extends AssetSummary {
    body: string
    code: string
    codeLanguage: string
    createdByName: string | null
    updatedByName: string | null
    createdAt: Date
}

/** POST /api/assets — a new draft */
export const NewAssetSchema = z.object({
    title: z.string().trim().min(2, 'Give it a title').max(200),
    kind: z.enum(ASSET_KINDS),
    clientId: z.string().uuid().nullable().default(null),
    productId: z.string().uuid().nullable().default(null),
})
export type NewAssetInput = z.infer<typeof NewAssetSchema>

/** PUT /api/assets/[assetId] */
export const SaveAssetSchema = z.object({
    title: z.string().trim().min(2, 'Give it a title').max(200),
    kind: z.enum(ASSET_KINDS),
    summary: z.string().trim().max(500).default(''),
    body: z.string().max(100000).default(''),
    url: z
        .string()
        .trim()
        .max(2000)
        .refine((url) => url === '' || /^https:\/\/\S+$/i.test(url), 'Use a full https:// link')
        .default(''),
    code: z.string().max(100000).default(''),
    codeLanguage: z.enum(CODE_LANGUAGES).default(''),
    clientId: z.string().uuid().nullable(),
    productId: z.string().uuid().nullable(),
    tags: TagsSchema.default([]),
    status: z.enum(PUBLISH_STATUSES),
})
export type SaveAssetInput = z.infer<typeof SaveAssetSchema>

/** GET /api/assets */
export const AssetsQuerySchema = z.object({
    q: z.string().trim().max(200).optional(),
    kind: z.enum(ASSET_KINDS).optional(),
    clientId: z.string().uuid().optional(),
    productId: z.string().uuid().optional(),
    status: z.enum(PUBLISH_STATUSES).optional(),
})
export type AssetsQuery = z.infer<typeof AssetsQuerySchema>
