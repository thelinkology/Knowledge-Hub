import { apiHandler, readJsonBody } from '@/server/routes/api'
import { emailKey, enforceRateLimit, ipKey } from '@/server/security/rateLimit'
import { getEmptyResponse } from '@/server/utils/response'
import { signIn } from '@/server/actions/auth'
import { SignInSchema } from '@/@types/auth/AuthSchema'

export const POST = apiHandler(async (req) => {
    const input = SignInSchema.parse(await readJsonBody(req))
    // Slows password guessing, per device and per account (email or username)
    await enforceRateLimit('signInPerIp', ipKey(req))
    await enforceRateLimit('signInPerEmail', emailKey(input.login))
    await signIn(input)
    return getEmptyResponse()
})
