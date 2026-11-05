import { z } from 'zod'
import { apiHandler, readJsonBody } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { reportError } from '@/server/observability/reportError'
import { enforceRateLimit, ipKey } from '@/server/security/rateLimit'

const ClientErrorSchema = z.object({
    message: z.string().max(1000),
    digest: z.string().max(100).optional(),
    path: z.string().max(300).optional(),
})

/** Errors the browser hit while showing a page (logged like server errors; no personal data) */
export const POST = apiHandler(async (req) => {
    const input = ClientErrorSchema.parse(await readJsonBody(req))
    await enforceRateLimit('clientErrorsPerIp', ipKey(req))
    const reference = reportError(new Error(input.message), {
        source: 'client',
        path: input.path,
        digest: input.digest,
    })
    return getJsonResponse({ reference })
})
