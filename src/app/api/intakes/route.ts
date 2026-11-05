import { apiAuthHandler, readJsonBody, readQuery } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { createIntake, getIntakes } from '@/server/actions/intake'
import { IntakesQuerySchema, NewIntakeSchema } from '@/@types/intake/Intake'

export const GET = apiAuthHandler('requirements.manage', async (req) =>
    getJsonResponse(await getIntakes(IntakesQuerySchema.parse(readQuery(req)))),
)

/** A new draft intake for a client; the form opens next */
export const POST = apiAuthHandler('requirements.manage', async (req, _ctx, user) =>
    getJsonResponse(await createIntake(user, NewIntakeSchema.parse(await readJsonBody(req))), { status: 201 }),
)
