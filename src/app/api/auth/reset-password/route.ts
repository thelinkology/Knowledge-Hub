import { apiHandler, readJsonBody } from '@/server/routes/api'
import { enforceRateLimit, ipKey } from '@/server/security/rateLimit'
import { getEmptyResponse } from '@/server/utils/response'
import { updatePassword } from '@/server/actions/auth'
import { ResetPasswordSchema } from '@/@types/auth/AuthSchema'

/** Sets a new password for the person signed in by their reset link */
export const POST = apiHandler(async (req) => {
    const input = ResetPasswordSchema.parse(await readJsonBody(req))
    await enforceRateLimit('resetPerIp', ipKey(req))
    await updatePassword(input)
    return getEmptyResponse()
})
