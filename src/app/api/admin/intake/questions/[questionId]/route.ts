import { apiAuthHandler, readId, readJsonBody } from '@/server/routes/api'
import { getEmptyResponse, getJsonResponse } from '@/server/utils/response'
import { deleteIntakeQuestion, updateIntakeQuestion } from '@/server/actions/intake'
import { IntakeQuestionSchema } from '@/@types/intake/IntakeQuestion'

type Params = { questionId: string }

export const PUT = apiAuthHandler<Params>('settings.manage', async (req, ctx, user) => {
    const questionId = readId((await ctx.params).questionId, 'question')
    return getJsonResponse(
        await updateIntakeQuestion(user, questionId, IntakeQuestionSchema.parse(await readJsonBody(req))),
    )
})

/** Deletes the question; answers already given stay in the intakes (no longer shown) */
export const DELETE = apiAuthHandler<Params>('settings.manage', async (_req, ctx, user) => {
    await deleteIntakeQuestion(user, readId((await ctx.params).questionId, 'question'))
    return getEmptyResponse()
})
