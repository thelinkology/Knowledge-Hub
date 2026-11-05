import 'server-only'
import type { NextRequest } from 'next/server'
import { apiHandler, type ApiRouteContext } from '@/server/routes/api'
import { authenticateAgent } from '@/server/security/agentAuth'
import type { AgentContext } from '@/@types/integrations/AgentApi'

type AgentRouteHandler<P extends Record<string, string>> = (
    req: NextRequest,
    ctx: ApiRouteContext<P>,
    agent: AgentContext,
) => Promise<Response>

/**
 * Wraps an agent API route (/api/v1, read-only): authenticates the API key (401), applies the per-key rate
 * limit (429) and turns thrown errors into JSON. Export it as `GET` only — the agent API never writes.
 * The handler must respect `agent.clientId` (a client-scoped key reads that client's + shared knowledge).
 */
export const agentHandler = <P extends Record<string, string> = Record<string, string>>(
    handler: AgentRouteHandler<P>,
) =>
    apiHandler<P>(async (req, ctx) => {
        const agent = await authenticateAgent(req)
        return handler(req, ctx, agent)
    })
