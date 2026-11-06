import { apiAuthHandler, readJsonBody, readQuery } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { createClient, getClients } from '@/server/actions/clients'
import { ClientSchema, ClientsQuerySchema } from '@/@types/clients/Client'

/** Every client for editors; viewers get only their own (for the knowledge filters) */
export const GET = apiAuthHandler('knowledge.read', async (req, _ctx, user) =>
    getJsonResponse(await getClients(ClientsQuerySchema.parse(readQuery(req)), user.clientIds)),
)

export const POST = apiAuthHandler('clients.manage', async (req, _ctx, user) =>
    getJsonResponse(await createClient(user, ClientSchema.parse(await readJsonBody(req))), { status: 201 }),
)
