import { apiAuthHandler, readJsonBody, readQuery } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { createArticle, getArticles } from '@/server/actions/knowledge'
import { ArticlesQuerySchema, NewArticleSchema } from '@/@types/knowledge/Article'

export const GET = apiAuthHandler('knowledge.read', async (req, _ctx, user) =>
    getJsonResponse(await getArticles(user, ArticlesQuerySchema.parse(readQuery(req)))),
)

/** A new draft; the editor opens next */
export const POST = apiAuthHandler('knowledge.manage', async (req, _ctx, user) =>
    getJsonResponse(await createArticle(user, NewArticleSchema.parse(await readJsonBody(req))), { status: 201 }),
)
