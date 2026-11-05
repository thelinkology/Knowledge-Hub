import { apiAuthHandler, readId } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { getArticleEditor } from '@/server/actions/knowledge'

export const GET = apiAuthHandler<{ articleId: string }>('knowledge.manage', async (_req, ctx) =>
    getJsonResponse(await getArticleEditor(readId((await ctx.params).articleId, 'article'))),
)
