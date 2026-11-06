import { z } from 'zod'
import { CreateApiKeySchema, type CreateApiKeyInput } from '@/@types/integrations/ApiKey'

/** What a key may read: every client, or shared knowledge plus the clients picked */
export const API_KEY_ACCESS = ['clients', 'all'] as const
export type ApiKeyAccess = (typeof API_KEY_ACCESS)[number]

/** The create/edit key form. (The server validates CreateApiKeySchema again — this is UX.) */
export const ApiKeyFormSchema = z.object({
    name: CreateApiKeySchema.shape.name,
    access: z.enum(API_KEY_ACCESS),
    clientIds: z.array(z.string()),
})
export type ApiKeyFormData = z.infer<typeof ApiKeyFormSchema>

export const toCreateApiKeyInput = (data: ApiKeyFormData): CreateApiKeyInput => ({
    name: data.name.trim(),
    allClients: data.access === 'all',
    clientIds: data.access === 'all' ? [] : data.clientIds,
})
