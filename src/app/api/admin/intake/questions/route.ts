import { apiAuthHandler, readJsonBody } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { createIntakeQuestion, getIntakeQuestions } from '@/server/actions/intake'
import { IntakeQuestionSchema } from '@/@types/intake/IntakeQuestion'

/** Every question (also read by intake authors, who don't manage settings) */
export const GET = apiAuthHandler('requirements.manage', async () => getJsonResponse(await getIntakeQuestions()))

export const POST = apiAuthHandler('settings.manage', async (req, _ctx, user) =>
    getJsonResponse(await createIntakeQuestion(user, IntakeQuestionSchema.parse(await readJsonBody(req))), {
        status: 201,
    }),
)
