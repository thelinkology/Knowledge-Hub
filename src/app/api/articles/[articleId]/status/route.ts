import { apiAuthHandler, readId, readJsonBody } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { setArticleStatus } from '@/server/actions/knowledge'
import { SetStatusSchema } from '@/@types/knowledge/Article'

/** Publish, unpublish (draft) or archive */
export const POST = apiAuthHandler<{ articleId: string }>('knowledge.manage', async (req, ctx, user) => {
    const articleId = readId((await ctx.params).articleId, 'article')
    const { status } = SetStatusSchema.parse(await readJsonBody(req))
    return getJsonResponse(await setArticleStatus(user, articleId, status))
})
