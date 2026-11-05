import { apiAuthHandler, readId, readJsonBody } from '@/server/routes/api'
import { enforceRateLimit } from '@/server/security/rateLimit'
import { getJsonResponse } from '@/server/utils/response'
import { generateBrds } from '@/server/actions/brds'
import { GenerateBrdsSchema } from '@/@types/brds/Brd'

type Params = { intakeId: string }

/** Generates the intake's BRDs (overwrites its draft BRDs; final ones are kept). Links use this site's origin. */
export const POST = apiAuthHandler<Params>('requirements.manage', async (req, ctx, user) => {
    const intakeId = readId((await ctx.params).intakeId, 'intake')
    const input = GenerateBrdsSchema.parse(await readJsonBody(req))
    await enforceRateLimit('generateBrdsPerUser', user.id)
    return getJsonResponse(await generateBrds(user, intakeId, input, req.nextUrl.origin), { status: 201 })
})
