import { apiAuthHandler, readId, readJsonBody } from '@/server/routes/api'
import { getEmptyResponse } from '@/server/utils/response'
import { setUserClients } from '@/server/actions/users'
import { SetUserClientsSchema } from '@/@types/users/UserAccount'

/** Replaces the clients someone is assigned to (a viewer reads shared knowledge plus these clients') */
export const PUT = apiAuthHandler<{ userId: string }>('users.manage', async (req, ctx, user) => {
    const userId = readId((await ctx.params).userId, 'user')
    await setUserClients(user, userId, SetUserClientsSchema.parse(await readJsonBody(req)))
    return getEmptyResponse()
})
