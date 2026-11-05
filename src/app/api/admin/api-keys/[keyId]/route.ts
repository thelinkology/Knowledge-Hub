import { apiAuthHandler, readId } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { revokeApiKey } from '@/server/actions/integrations'

/** Revokes the key (kept in the list as revoked, so its use stays traceable) */
export const DELETE = apiAuthHandler<{ keyId: string }>('settings.manage', async (_req, ctx, user) => {
    const keyId = readId((await ctx.params).keyId, 'API key')
    return getJsonResponse(await revokeApiKey(user, keyId))
})
