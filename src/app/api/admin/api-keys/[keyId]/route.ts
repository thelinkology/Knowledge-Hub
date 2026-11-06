import { apiAuthHandler, readId, readJsonBody } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { revokeApiKey, updateApiKey } from '@/server/actions/integrations'
import { UpdateApiKeySchema } from '@/@types/integrations/ApiKey'

/** Renames the key or changes the clients it may read (from the agent's next request on) */
export const PATCH = apiAuthHandler<{ keyId: string }>('settings.manage', async (req, ctx, user) => {
    const keyId = readId((await ctx.params).keyId, 'API key')
    return getJsonResponse(await updateApiKey(user, keyId, UpdateApiKeySchema.parse(await readJsonBody(req))))
})

/** Revokes the key (kept in the list as revoked, so its use stays traceable) */
export const DELETE = apiAuthHandler<{ keyId: string }>('settings.manage', async (_req, ctx, user) => {
    const keyId = readId((await ctx.params).keyId, 'API key')
    return getJsonResponse(await revokeApiKey(user, keyId))
})
