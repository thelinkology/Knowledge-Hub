import { z } from 'zod'
import { apiAuthHandler, readJsonBody, readQuery } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { createCollection, getCollections } from '@/server/actions/knowledge'
import { CollectionSchema } from '@/@types/knowledge/KnowledgeCollection'

const QuerySchema = z.object({ clientId: z.string().uuid().optional(), productId: z.string().uuid().optional() })

export const GET = apiAuthHandler('knowledge.read', async (req, _ctx, user) =>
    getJsonResponse(await getCollections(user, QuerySchema.parse(readQuery(req)))),
)

export const POST = apiAuthHandler('knowledge.manage', async (req, _ctx, user) =>
    getJsonResponse(await createCollection(user, CollectionSchema.parse(await readJsonBody(req))), { status: 201 }),
)
