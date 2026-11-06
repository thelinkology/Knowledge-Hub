import { apiAuthHandler, readId } from '@/server/routes/api'
import { enforceRateLimit } from '@/server/security/rateLimit'
import { getJsonResponse } from '@/server/utils/response'
import { revealApiKey } from '@/server/actions/integrations'

/** The key itself, to copy again (POST, so it's never cached or prefetched). Recorded in the audit log. */
export const POST = apiAuthHandler<{ keyId: string }>('settings.manage', async (_req, ctx, user) => {
    const keyId = readId((await ctx.params).keyId, 'API key')
    await enforceRateLimit('revealKeyPerUser', user.id)
    return getJsonResponse(await revealApiKey(user, keyId))
})
