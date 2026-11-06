import { apiAuthHandler, readJsonBody, readQuery } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { createAsset, getAssets } from '@/server/actions/library'
import { AssetsQuerySchema, NewAssetSchema } from '@/@types/library/Asset'

/** The library (viewers: published only) */
export const GET = apiAuthHandler('library.read', async (req, _ctx, user) =>
    getJsonResponse(await getAssets(user, AssetsQuerySchema.parse(readQuery(req)))),
)

/** A new draft; the editor opens next */
export const POST = apiAuthHandler('knowledge.manage', async (req, _ctx, user) =>
    getJsonResponse(await createAsset(user, NewAssetSchema.parse(await readJsonBody(req))), { status: 201 }),
)
