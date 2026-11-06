import { apiAuthHandler, readId, readJsonBody } from '@/server/routes/api'
import { getEmptyResponse } from '@/server/utils/response'
import { arrangeCollection } from '@/server/actions/knowledge'
import { ArrangeCollectionSchema } from '@/@types/knowledge/KnowledgeCollection'

/** The table of contents: each article's parent and position among its siblings */
export const PUT = apiAuthHandler<{ collectionId: string }>('knowledge.manage', async (req, ctx) => {
    const collectionId = readId((await ctx.params).collectionId, 'collection')
    await arrangeCollection(collectionId, ArrangeCollectionSchema.parse(await readJsonBody(req)).items)
    return getEmptyResponse()
})
