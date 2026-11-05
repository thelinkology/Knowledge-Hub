import { apiAuthHandler, readId } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { restoreArticleRevision } from '@/server/actions/knowledge'

/** Restores an old version (saved as a new version; history is kept) */
export const POST = apiAuthHandler<{ articleId: string; revisionId: string }>(
    'knowledge.manage',
    async (_req, ctx, user) => {
        const params = await ctx.params
        return getJsonResponse(
            await restoreArticleRevision(
                user,
                readId(params.articleId, 'article'),
                readId(params.revisionId, 'version'),
            ),
        )
    },
)
