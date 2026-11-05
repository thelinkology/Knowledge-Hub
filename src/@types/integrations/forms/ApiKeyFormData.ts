import { z } from 'zod'
import { CreateApiKeySchema, type CreateApiKeyInput } from '@/@types/integrations/ApiKey'

/**
 * The "Create key" form. The client picker holds '' for "all clients". (The server validates
 * CreateApiKeySchema again — this is UX.)
 */
export const ApiKeyFormSchema = z.object({
    name: CreateApiKeySchema.shape.name,
    clientId: z.string(),
})
export type ApiKeyFormData = z.infer<typeof ApiKeyFormSchema>

export const toCreateApiKeyInput = (data: ApiKeyFormData): CreateApiKeyInput => ({
    name: data.name.trim(),
    clientId: data.clientId || null,
})
