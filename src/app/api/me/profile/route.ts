import { apiAuthHandler, readJsonBody } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { getMyProfile, updateProfile } from '@/server/actions/users'
import { UpdateProfileSchema } from '@/@types/users/UserAccount'

export const GET = apiAuthHandler(null, async (_req, _ctx, user) => getJsonResponse(await getMyProfile(user)))

export const PATCH = apiAuthHandler(null, async (req, _ctx, user) =>
    getJsonResponse(await updateProfile(user, UpdateProfileSchema.parse(await readJsonBody(req)))),
)
