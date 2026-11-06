import { apiAuthHandler, readId, readJsonBody } from '@/server/routes/api'
import { getEmptyResponse, getJsonResponse } from '@/server/utils/response'
import { deleteClient, getClient, updateClient } from '@/server/actions/clients'
import { ClientSchema } from '@/@types/clients/Client'

type Params = { clientId: string }

export const GET = apiAuthHandler<Params>('clients.read', async (_req, ctx, user) =>
    getJsonResponse(await getClient(readId((await ctx.params).clientId, 'client'), user)),
)

export const PUT = apiAuthHandler<Params>('clients.manage', async (req, ctx, user) => {
    const clientId = readId((await ctx.params).clientId, 'client')
    return getJsonResponse(await updateClient(user, clientId, ClientSchema.parse(await readJsonBody(req))))
})

/** Deletes the client with its own articles, assets, intakes and BRDs. Can't be undone. */
export const DELETE = apiAuthHandler<Params>('clients.manage', async (_req, ctx, user) => {
    await deleteClient(user, readId((await ctx.params).clientId, 'client'))
    return getEmptyResponse()
})
