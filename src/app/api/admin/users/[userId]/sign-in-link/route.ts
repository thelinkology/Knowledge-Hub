import { apiAuthHandler, readId } from '@/server/routes/api'
import { enforceRateLimit } from '@/server/security/rateLimit'
import { getJsonResponse } from '@/server/utils/response'
import { sendUserSignInLink } from '@/server/actions/users'

/** Emails the person a one-time sign-in link (administrators). Returns the address it went to. */
export const POST = apiAuthHandler<{ userId: string }>('users.manage', async (req, ctx, user) => {
    const userId = readId((await ctx.params).userId, 'user')
    await enforceRateLimit('signInLinkPerUser', user.id)
    return getJsonResponse(await sendUserSignInLink(user, userId, req.nextUrl.origin))
})
