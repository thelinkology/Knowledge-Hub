import { apiAuthHandler, readJsonBody } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { createIntakeRule, getIntakeRules } from '@/server/actions/intake'
import { IntakeRuleSchema } from '@/@types/intake/IntakeRule'

/** Every rule, active or not */
export const GET = apiAuthHandler('settings.manage', async () => getJsonResponse(await getIntakeRules()))

export const POST = apiAuthHandler('settings.manage', async (req, _ctx, user) =>
    getJsonResponse(await createIntakeRule(user, IntakeRuleSchema.parse(await readJsonBody(req))), { status: 201 }),
)
