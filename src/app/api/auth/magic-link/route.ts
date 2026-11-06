import { apiHandler, readJsonBody } from '@/server/routes/api'
import { emailKey, enforceRateLimit, ipKey } from '@/server/security/rateLimit'
import { getEmptyResponse } from '@/server/utils/response'
import { sendSignInLink } from '@/server/actions/auth'
import { EmailOnlySchema } from '@/@types/auth/AuthSchema'

/** Emails a sign-in link to an existing account (same response whether or not the email has an account) */
export const POST = apiHandler(async (req) => {
    const { email } = EmailOnlySchema.parse(await readJsonBody(req))
    // Stops the app being used to flood someone's inbox
    await enforceRateLimit('emailPerIp', ipKey(req))
    await enforceRateLimit('emailPerAddress', emailKey(email))
    await sendSignInLink(email, req.nextUrl.origin)
    return getEmptyResponse()
})
