import 'server-only'
import type { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/server/data/supabase/admin'
import { unwrapMaybe } from '@/server/data/supabase/errors'
import { hashApiKey } from '@/server/actions/integrations'
import { enforceRateLimit } from '@/server/security/rateLimit'
import { UnauthorizedError } from '@/@types/errors'
import { readApiKey } from '@/utils/apiKeys'
import type { AgentContext } from '@/@types/integrations/AgentApi'

/** last_used_at is written at most this often per key (it's for "is this key still in use?", not metering) */
const LAST_USED_RESOLUTION_MS = 60_000

const invalidKey = () => new UnauthorizedError('A valid API key is required.', 'INVALID_API_KEY')

/**
 * Authenticates an agent request (/api/v1). The key comes from `Authorization: Bearer <key>` or
 * `x-api-key` — never from the query string. Only its SHA-256 is looked up; revoked keys are refused.
 * Every request counts against the key's rate limit. The key itself is never logged.
 */
export async function authenticateAgent(req: NextRequest): Promise<AgentContext> {
    const secret = readApiKey(req.headers)
    if (!secret) throw invalidKey()

    const key = unwrapMaybe(
        await supabaseAdmin()
            .from('api_keys')
            .select('id, all_clients, last_used_at, api_key_clients(client_id)')
            .eq('key_hash', hashApiKey(secret))
            .is('revoked_at', null)
            .maybeSingle(),
        'check the API key',
    )
    if (!key) throw invalidKey()

    await enforceRateLimit('agentPerKey', key.id)

    const lastUsed = key.last_used_at ? new Date(key.last_used_at).getTime() : 0
    if (Date.now() - lastUsed >= LAST_USED_RESOLUTION_MS) {
        const { error } = await supabaseAdmin()
            .from('api_keys')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', key.id)
        // Bookkeeping only: a failure here must not fail the agent's request
        if (error) console.error('[agent-auth] Couldn’t record key use', key.id, error.message)
    }

    return {
        keyId: key.id,
        clientIds: key.all_clients ? null : key.api_key_clients.map((link) => link.client_id),
    }
}
