import { readId } from '@/server/routes/api'
import { agentHandler } from '@/server/routes/api/agent'
import { getJsonResponse } from '@/server/utils/response'
import { agentGetArticle } from '@/server/actions/integrations/agent'

/** Agent API: one published article with its Markdown body (GetArticle) */
export const GET = agentHandler<{ articleId: string }>(async (req, ctx, agent) => {
    const articleId = readId((await ctx.params).articleId, 'article')
    return getJsonResponse(await agentGetArticle(agent, articleId, req.nextUrl.origin))
})
