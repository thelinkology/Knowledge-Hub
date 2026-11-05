import { apiAuthHandler, readId, readJsonBody } from '@/server/routes/api'
import { getEmptyResponse } from '@/server/utils/response'
import { reorderCollection } from '@/server/actions/knowledge'
import { ReorderSchema } from '@/@types/knowledge/KnowledgeCollection'

export const PUT = apiAuthHandler<{ collectionId: string }>('knowledge.manage', async (req, ctx) => {
    const collectionId = readId((await ctx.params).collectionId, 'collection')
    await reorderCollection(collectionId, ReorderSchema.parse(await readJsonBody(req)).ids)
    return getEmptyResponse()
})
