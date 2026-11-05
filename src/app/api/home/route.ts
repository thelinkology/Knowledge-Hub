import { apiAuthHandler } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { getHomeOverview } from '@/server/actions/reports'

/** The home page overview (editors also get drafts, intakes and recent BRDs) */
export const GET = apiAuthHandler('knowledge.read', async (_req, _ctx, user) =>
    getJsonResponse(await getHomeOverview(user)),
)
