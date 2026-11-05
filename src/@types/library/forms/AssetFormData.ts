import { z } from 'zod'
import { ASSET_KINDS, CODE_LANGUAGES } from '@/@types/library/Asset'
import { parseTagsText } from '@/utils/tags'

/**
 * The asset editor's form. Pickers hold '' for "none"; tags are typed as comma-separated text; the
 * status is set by the editor's buttons. (The server validates SaveAssetSchema again — this is UX.)
 */
export const AssetFormSchema = z.object({
    title: z.string().trim().min(2, 'Give the asset a title').max(200),
    kind: z.enum(ASSET_KINDS),
    summary: z.string().trim().max(500, 'Keep the summary under 500 characters'),
    body: z.string().max(100000, 'The instructions are too long. Link to longer documents instead.'),
    url: z
        .string()
        .trim()
        .max(2000)
        .refine((url) => url === '' || /^https:\/\/\S+$/i.test(url), 'Use a full https:// link'),
    code: z.string().max(100000, 'The snippet is too long. Link to the full file instead.'),
    codeLanguage: z.enum(CODE_LANGUAGES),
    clientId: z.string(),
    productId: z.string(),
    tagsText: z
        .string()
        .max(1000)
        .refine((text) => parseTagsText(text).length <= 20, 'Use up to 20 tags'),
})
export type AssetFormData = z.infer<typeof AssetFormSchema>

/** The "New asset" dialog (becomes NewAssetInput) */
export const NewAssetFormSchema = z.object({
    title: z.string().trim().min(2, 'Give the asset a title').max(200),
    kind: z.enum(ASSET_KINDS),
    clientId: z.string(),
    productId: z.string(),
})
export type NewAssetFormData = z.infer<typeof NewAssetFormSchema>
