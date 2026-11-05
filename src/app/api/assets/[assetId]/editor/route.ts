import { apiAuthHandler, readId } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { getAssetEditor } from '@/server/actions/library'

export const GET = apiAuthHandler<{ assetId: string }>('knowledge.manage', async (_req, ctx) =>
    getJsonResponse(await getAssetEditor(readId((await ctx.params).assetId, 'asset'))),
)
