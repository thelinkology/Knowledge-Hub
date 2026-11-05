import { apiAuthHandler, readId, readJsonBody } from '@/server/routes/api'
import { getEmptyResponse, getJsonResponse } from '@/server/utils/response'
import { deleteIntake, getIntakeEditor, saveIntake } from '@/server/actions/intake'
import { SaveIntakeSchema } from '@/@types/intake/Intake'

type Params = { intakeId: string }

/** The intake form's data: the intake, questions, active rules, products and linked titles */
export const GET = apiAuthHandler<Params>('requirements.manage', async (_req, ctx) =>
    getJsonResponse(await getIntakeEditor(readId((await ctx.params).intakeId, 'intake'))),
)

/** The form's save (returns the refreshed form data) */
export const PUT = apiAuthHandler<Params>('requirements.manage', async (req, ctx, user) => {
    const intakeId = readId((await ctx.params).intakeId, 'intake')
    return getJsonResponse(await saveIntake(user, intakeId, SaveIntakeSchema.parse(await readJsonBody(req))))
})

/** Deletes the intake; BRDs generated from it are kept. Can't be undone. */
export const DELETE = apiAuthHandler<Params>('requirements.manage', async (_req, ctx, user) => {
    await deleteIntake(user, readId((await ctx.params).intakeId, 'intake'))
    return getEmptyResponse()
})
