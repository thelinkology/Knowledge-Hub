import { apiAuthHandler, readId, readJsonBody } from '@/server/routes/api'
import { getEmptyResponse, getJsonResponse } from '@/server/utils/response'
import { deleteIntakeRule, updateIntakeRule } from '@/server/actions/intake'
import { IntakeRuleSchema } from '@/@types/intake/IntakeRule'

type Params = { ruleId: string }

export const PUT = apiAuthHandler<Params>('settings.manage', async (req, ctx, user) => {
    const ruleId = readId((await ctx.params).ruleId, 'rule')
    return getJsonResponse(await updateIntakeRule(user, ruleId, IntakeRuleSchema.parse(await readJsonBody(req))))
})

export const DELETE = apiAuthHandler<Params>('settings.manage', async (_req, ctx, user) => {
    await deleteIntakeRule(user, readId((await ctx.params).ruleId, 'rule'))
    return getEmptyResponse()
})
