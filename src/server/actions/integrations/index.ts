import 'server-only'
import { createHash, randomBytes } from 'node:crypto'
import { supabaseAdmin } from '@/server/data/supabase/admin'
import { check, unwrap, unwrapMaybe } from '@/server/data/supabase/errors'
import { recordAudit } from '@/server/actions/audit'
import { assertClientExists } from '@/server/actions/clients'
import { NotFoundError } from '@/@types/errors'
import { API_KEY_PREFIX, API_KEY_RANDOM_BYTES, apiKeyDisplayPrefix } from '@/utils/apiKeys'
import type { SessionUser } from '@/@types/auth/SessionUser'
import type { ApiKey, CreateApiKeyInput, CreatedApiKey } from '@/@types/integrations/ApiKey'

/*
 * Agent API keys (Copilot Studio). Only the SHA-256 of a key is stored; the key itself is returned once,
 * when it's created. Keys can be limited to one client and revoked; the routes check `settings.manage`.
 */

/** The stored form of a key (sha256, hex) — what /api/v1 looks keys up by */
export const hashApiKey = (secret: string) => createHash('sha256').update(secret, 'utf8').digest('hex')

const API_KEY_SELECT =
    'id, name, prefix, client_id, created_at, last_used_at, revoked_at, client:clients(name), creator:profiles!api_keys_created_by_fkey(display_name)'

interface ApiKeyRow {
    id: string
    name: string
    prefix: string
    client_id: string | null
    created_at: string
    last_used_at: string | null
    revoked_at: string | null
    client: { name: string } | null
    creator: { display_name: string } | null
}

const mapApiKey = (row: ApiKeyRow): ApiKey => ({
    id: row.id,
    name: row.name,
    prefix: row.prefix,
    clientId: row.client_id,
    clientName: row.client?.name ?? null,
    createdByName: row.creator?.display_name ?? null,
    createdAt: new Date(row.created_at),
    lastUsedAt: row.last_used_at ? new Date(row.last_used_at) : null,
    revokedAt: row.revoked_at ? new Date(row.revoked_at) : null,
})

const keyNotFound = () => new NotFoundError('That API key doesn’t exist.', 'API_KEY_NOT_FOUND')

/** Every key, newest first (active and revoked) */
export async function listApiKeys(): Promise<ApiKey[]> {
    return unwrap(
        await supabaseAdmin()
            .from('api_keys')
            .select(API_KEY_SELECT)
            .order('revoked_at', { ascending: false, nullsFirst: true })
            .order('created_at', { ascending: false })
            .limit(500),
        'load the API keys',
    ).map((row) => mapApiKey(row as unknown as ApiKeyRow))
}

async function loadApiKey(keyId: string): Promise<ApiKey | null> {
    const row = unwrapMaybe(
        await supabaseAdmin().from('api_keys').select(API_KEY_SELECT).eq('id', keyId).maybeSingle(),
        'load the API key',
    )
    return row ? mapApiKey(row as unknown as ApiKeyRow) : null
}

/** Creates a key. The secret is in the result and nowhere else — it can't be shown again. */
export async function createApiKey(admin: SessionUser, input: CreateApiKeyInput): Promise<CreatedApiKey> {
    await assertClientExists(input.clientId)
    const secret = `${API_KEY_PREFIX}${randomBytes(API_KEY_RANDOM_BYTES).toString('base64url')}`
    const inserted = unwrap(
        await supabaseAdmin()
            .from('api_keys')
            .insert({
                name: input.name,
                prefix: apiKeyDisplayPrefix(secret),
                key_hash: hashApiKey(secret),
                client_id: input.clientId,
                created_by: admin.id,
            })
            .select('id')
            .single(),
        'create the API key',
    )
    await recordAudit(admin.id, 'api_key.created', 'api_key', inserted.id, {
        name: input.name,
        clientId: input.clientId,
    })
    const apiKey = await loadApiKey(inserted.id)
    if (!apiKey) throw keyNotFound()
    return { apiKey, secret }
}

/** Revokes a key: agents using it get 401 from the next request on. Revoking twice is harmless. */
export async function revokeApiKey(admin: SessionUser, keyId: string): Promise<ApiKey> {
    const existing = await loadApiKey(keyId)
    if (!existing) throw keyNotFound()
    if (existing.revokedAt) return existing
    check(
        await supabaseAdmin()
            .from('api_keys')
            .update({ revoked_at: new Date().toISOString() })
            .eq('id', keyId)
            .is('revoked_at', null),
        'revoke the API key',
    )
    await recordAudit(admin.id, 'api_key.revoked', 'api_key', keyId, { name: existing.name })
    return (await loadApiKey(keyId)) ?? existing
}
