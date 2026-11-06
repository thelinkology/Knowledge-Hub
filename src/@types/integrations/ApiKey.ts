import { z } from 'zod'

/** An agent API key as listed (the key itself is only sent when an administrator asks to see it) */
export interface ApiKey {
    id: string
    name: string
    /** The first characters, to recognise the key (e.g. "kh_3f9a") */
    prefix: string
    /** Reads every client's knowledge */
    allClients: boolean
    /** Otherwise: shared knowledge plus these clients' knowledge (none = shared knowledge only) */
    clients: { id: string; name: string }[]
    /** False for keys made before keys could be shown again (and for revoked keys) */
    canReveal: boolean
    createdByName: string | null
    createdAt: Date
    lastUsedAt: Date | null
    revokedAt: Date | null
}

export interface CreatedApiKey {
    apiKey: ApiKey
    /** The full secret */
    secret: string
}

/** What a key may read: every client, or shared knowledge plus the clients picked */
const ApiKeyAccessSchema = {
    allClients: z.boolean().default(false),
    clientIds: z.array(z.string().uuid()).max(200, 'Pick at most 200 clients').default([]),
}

/** POST /api/admin/api-keys */
export const CreateApiKeySchema = z.object({
    name: z.string().trim().min(2, 'Name the key, e.g. “Copilot Studio – Sales agent”').max(80),
    ...ApiKeyAccessSchema,
})
export type CreateApiKeyInput = z.infer<typeof CreateApiKeySchema>

/** PATCH /api/admin/api-keys/[keyId] — rename it or change what it may read */
export const UpdateApiKeySchema = CreateApiKeySchema
export type UpdateApiKeyInput = z.infer<typeof UpdateApiKeySchema>
