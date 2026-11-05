import { agentHandler } from '@/server/routes/api/agent'
import { getJsonResponse } from '@/server/utils/response'
import { agentListClients } from '@/server/actions/integrations/agent'

/** Agent API: the clients this key may read (ListClients) */
export const GET = agentHandler(async (_req, _ctx, agent) => getJsonResponse(await agentListClients(agent)))
