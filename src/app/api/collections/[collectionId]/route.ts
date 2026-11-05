import { apiAuthHandler, readId, readJsonBody } from '@/server/routes/api'
import { getEmptyResponse, getJsonResponse } from '@/server/utils/response'
import { deleteCollection, getCollection, updateCollection } from '@/server/actions/knowledge'
import { CollectionSchema } from '@/@types/knowledge/KnowledgeCollection'

type Params = { collectionId: string }

export const GET = apiAuthHandler<Params>('knowledge.read', async (_req, ctx, user) =>
    getJsonResponse(await getCollection(user, readId((await ctx.params).collectionId, 'collection'))),
)

export const PUT = apiAuthHandler<Params>('knowledge.manage', async (req, ctx, user) => {
    const collectionId = readId((await ctx.params).collectionId, 'collection')
    return getJsonResponse(await updateCollection(user, collectionId, CollectionSchema.parse(await readJsonBody(req))))
})

/** Deletes the collection; its articles are kept, ungrouped */
export const DELETE = apiAuthHandler<Params>('knowledge.manage', async (_req, ctx, user) => {
    await deleteCollection(user, readId((await ctx.params).collectionId, 'collection'))
    return getEmptyResponse()
})
