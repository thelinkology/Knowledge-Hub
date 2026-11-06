import { apiHandler, readJsonBody } from '@/server/routes/api'
import { emailKey, enforceRateLimit, ipKey } from '@/server/security/rateLimit'
import { getEmptyResponse } from '@/server/utils/response'
import { sendSignInLink } from '@/server/actions/auth'
import { SignInLinkSchema } from '@/@types/auth/AuthSchema'
import { RETURN_TO_COOKIE } from '@/constants/auth.constant'
import { isSafeReturnPath } from '@/utils/returnTo'

/**
 * Emails a sign-in link to an existing account (same response whether or not the email has an account).
 * Where they were going (`returnTo`) is remembered in this browser for the hour the link works.
 */
export const POST = apiHandler(async (req) => {
    const { email, returnTo } = SignInLinkSchema.parse(await readJsonBody(req))
    // Stops the app being used to flood someone's inbox
    await enforceRateLimit('emailPerIp', ipKey(req))
    await enforceRateLimit('emailPerAddress', emailKey(email))
    await sendSignInLink(email, req.nextUrl.origin)
    const response = getEmptyResponse()
    if (isSafeReturnPath(returnTo) && returnTo !== '/') {
        response.cookies.set(RETURN_TO_COOKIE, returnTo, {
            httpOnly: true,
            sameSite: 'lax',
            secure: req.nextUrl.protocol === 'https:',
            path: '/auth',
            maxAge: 3600,
        })
    }
    return response
})
