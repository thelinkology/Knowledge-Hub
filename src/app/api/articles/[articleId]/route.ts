import { apiAuthHandler, readId, readJsonBody } from '@/server/routes/api'
import { getEmptyResponse, getJsonResponse } from '@/server/utils/response'
import { deleteArticle, getArticleView, saveArticle } from '@/server/actions/knowledge'
import { SaveArticleSchema } from '@/@types/knowledge/Article'

type Params = { articleId: string }

/** The reader view (viewers: published only) */
export const GET = apiAuthHandler<Params>('knowledge.read', async (_req, ctx, user) =>
    getJsonResponse(await getArticleView(user, readId((await ctx.params).articleId, 'article'))),
)

/** The editor's save (returns the refreshed editor data) */
export const PUT = apiAuthHandler<Params>('knowledge.manage', async (req, ctx, user) => {
    const articleId = readId((await ctx.params).articleId, 'article')
    return getJsonResponse(await saveArticle(user, articleId, SaveArticleSchema.parse(await readJsonBody(req))))
})

export const DELETE = apiAuthHandler<Params>('knowledge.manage', async (_req, ctx, user) => {
    await deleteArticle(user, readId((await ctx.params).articleId, 'article'))
    return getEmptyResponse()
})
