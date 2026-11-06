import { apiAuthHandler, readId, readJsonBody } from '@/server/routes/api'
import { getEmptyResponse, getJsonResponse } from '@/server/utils/response'
import { deleteAsset, getAsset, saveAsset } from '@/server/actions/library'
import { SaveAssetSchema } from '@/@types/library/Asset'

type Params = { assetId: string }

/** One asset (viewers: published only) */
export const GET = apiAuthHandler<Params>('library.read', async (_req, ctx, user) =>
    getJsonResponse(await getAsset(user, readId((await ctx.params).assetId, 'asset'))),
)

/** The editor's save, including the status (returns the refreshed editor data) */
export const PUT = apiAuthHandler<Params>('knowledge.manage', async (req, ctx, user) => {
    const assetId = readId((await ctx.params).assetId, 'asset')
    return getJsonResponse(await saveAsset(user, assetId, SaveAssetSchema.parse(await readJsonBody(req))))
})

export const DELETE = apiAuthHandler<Params>('knowledge.manage', async (_req, ctx, user) => {
    await deleteAsset(user, readId((await ctx.params).assetId, 'asset'))
    return getEmptyResponse()
})
