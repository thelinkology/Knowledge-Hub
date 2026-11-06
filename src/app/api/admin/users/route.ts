import { apiAuthHandler, readJsonBody, readQuery } from '@/server/routes/api'
import { enforceRateLimit } from '@/server/security/rateLimit'
import { getJsonResponse } from '@/server/utils/response'
import { getUsers, inviteUser } from '@/server/actions/users'
import { InviteUserSchema, UsersQuerySchema } from '@/@types/users/UserAccount'

export const GET = apiAuthHandler('users.manage', async (req) =>
    getJsonResponse(await getUsers(UsersQuerySchema.parse(readQuery(req)))),
)

/** Creates an account: an emailed invitation, or a password the administrator sets */
export const POST = apiAuthHandler('users.manage', async (req, _ctx, user) => {
    const input = InviteUserSchema.parse(await readJsonBody(req))
    await enforceRateLimit('invitePerUser', user.id)
    return getJsonResponse(await inviteUser(user, input, req.nextUrl.origin), { status: 201 })
})
