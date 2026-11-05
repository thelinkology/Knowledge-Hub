import { readId } from '@/server/routes/api'
import { agentHandler } from '@/server/routes/api/agent'
import { getJsonResponse } from '@/server/utils/response'
import { agentGetAsset } from '@/server/actions/integrations/agent'

/** Agent API: one published library asset (GetAsset) */
export const GET = agentHandler<{ assetId: string }>(async (req, ctx, agent) => {
    const assetId = readId((await ctx.params).assetId, 'asset')
    return getJsonResponse(await agentGetAsset(agent, assetId, req.nextUrl.origin))
})
