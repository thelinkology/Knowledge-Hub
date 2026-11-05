import { apiAuthHandler, readId, readJsonBody } from '@/server/routes/api'
import { getEmptyResponse, getJsonResponse } from '@/server/utils/response'
import { deleteBrd, getBrd, saveBrd } from '@/server/actions/brds'
import { SaveBrdSchema } from '@/@types/brds/Brd'

type Params = { brdId: string }

export const GET = apiAuthHandler<Params>('requirements.manage', async (_req, ctx) =>
    getJsonResponse(await getBrd(readId((await ctx.params).brdId, 'BRD'))),
)

/** The editor's save (returns the saved BRD) */
export const PUT = apiAuthHandler<Params>('requirements.manage', async (req, ctx, user) => {
    const brdId = readId((await ctx.params).brdId, 'BRD')
    return getJsonResponse(await saveBrd(user, brdId, SaveBrdSchema.parse(await readJsonBody(req))))
})

export const DELETE = apiAuthHandler<Params>('requirements.manage', async (_req, ctx, user) => {
    await deleteBrd(user, readId((await ctx.params).brdId, 'BRD'))
    return getEmptyResponse()
})
