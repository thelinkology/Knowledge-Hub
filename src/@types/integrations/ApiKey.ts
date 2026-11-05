import { z } from 'zod'

/** An agent API key as listed (the key itself is only ever shown once, when created) */
export interface ApiKey {
    id: string
    name: string
    /** The first characters, to recognise the key (e.g. "kh_3f9a") */
    prefix: string
    clientId: string | null
    clientName: string | null
    createdByName: string | null
    createdAt: Date
    lastUsedAt: Date | null
    revokedAt: Date | null
}

export interface CreatedApiKey {
    apiKey: ApiKey
    /** The full secret — shown once, never stored */
    secret: string
}

/** POST /api/admin/api-keys */
export const CreateApiKeySchema = z.object({
    name: z.string().trim().min(2, 'Name the key, e.g. “Copilot Studio – Sales agent”').max(80),
    clientId: z.string().uuid().nullable().default(null),
})
export type CreateApiKeyInput = z.infer<typeof CreateApiKeySchema>
