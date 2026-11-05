import { apiHandler, readJsonBody } from '@/server/routes/api'
import { emailKey, enforceRateLimit, ipKey } from '@/server/security/rateLimit'
import { getEmptyResponse } from '@/server/utils/response'
import { resendConfirmation } from '@/server/actions/auth'
import { EmailOnlySchema } from '@/@types/auth/AuthSchema'

/** Sends the sign-up confirmation email again (same response whether or not the email has an account) */
export const POST = apiHandler(async (req) => {
    const input = EmailOnlySchema.parse(await readJsonBody(req))
    // Stops the app being used to flood someone's inbox
    await enforceRateLimit('emailPerIp', ipKey(req))
    await enforceRateLimit('emailPerAddress', emailKey(input.email))
    await resendConfirmation(input, req.nextUrl.origin)
    return getEmptyResponse()
})
