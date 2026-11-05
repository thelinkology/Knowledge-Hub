import { readQuery } from '@/server/routes/api'
import { agentHandler } from '@/server/routes/api/agent'
import { getJsonResponse } from '@/server/utils/response'
import { agentSearch } from '@/server/actions/integrations/agent'
import { AgentSearchQuerySchema } from '@/@types/integrations/AgentApi'

/** Agent API: ranked search over published articles and library assets (SearchKnowledge) */
export const GET = agentHandler(async (req, _ctx, agent) =>
    getJsonResponse(await agentSearch(agent, AgentSearchQuerySchema.parse(readQuery(req)), req.nextUrl.origin)),
)
