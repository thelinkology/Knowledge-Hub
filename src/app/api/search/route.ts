import { apiAuthHandler, readQuery } from '@/server/routes/api'
import { enforceRateLimit } from '@/server/security/rateLimit'
import { getJsonResponse } from '@/server/utils/response'
import { canEdit, searchKnowledge } from '@/server/actions/knowledge'
import { SearchQuerySchema } from '@/@types/knowledge/Search'

/** Ranked search over articles and library assets (editors also find drafts) */
export const GET = apiAuthHandler('knowledge.read', async (req, _ctx, user) => {
    const query = SearchQuerySchema.parse(readQuery(req))
    await enforceRateLimit('searchPerUser', user.id)
    return getJsonResponse(await searchKnowledge(query, { includeDrafts: canEdit(user) }))
})
