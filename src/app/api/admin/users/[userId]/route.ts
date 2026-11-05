import { apiAuthHandler, readId, readJsonBody } from '@/server/routes/api'
import { getEmptyResponse } from '@/server/utils/response'
import { deleteUserAccount, setUserRole } from '@/server/actions/users'
import { SetRoleSchema } from '@/@types/users/UserAccount'

export const PATCH = apiAuthHandler<{ userId: string }>('users.manage', async (req, ctx, user) => {
    const userId = readId((await ctx.params).userId, 'user')
    await setUserRole(user, userId, SetRoleSchema.parse(await readJsonBody(req)))
    return getEmptyResponse()
})

/** Deletes the account. Content they wrote stays, without an author. Can't be undone. */
export const DELETE = apiAuthHandler<{ userId: string }>('users.manage', async (_req, ctx, user) => {
    await deleteUserAccount(user, readId((await ctx.params).userId, 'user'))
    return getEmptyResponse()
})
