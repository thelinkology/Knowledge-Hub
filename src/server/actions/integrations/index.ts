import 'server-only'
import { createHash, randomBytes } from 'node:crypto'
import { supabaseAdmin } from '@/server/data/supabase/admin'
import { check, unwrap, unwrapMaybe } from '@/server/data/supabase/errors'
import { recordAudit } from '@/server/actions/audit'
import { assertClientsExist } from '@/server/actions/clients'
import { openSecret, sealSecret } from '@/server/security/secretBox'
import { ConflictError, NotFoundError } from '@/@types/errors'
import { API_KEY_PREFIX, API_KEY_RANDOM_BYTES, apiKeyDisplayPrefix } from '@/utils/apiKeys'
import type { SessionUser } from '@/@types/auth/SessionUser'
import type { ApiKey, CreateApiKeyInput, CreatedApiKey, UpdateApiKeyInput } from '@/@types/integrations/ApiKey'

/*
 * Agent API keys (Copilot Studio). Requests are checked against the key's SHA-256; the key itself is also
 * stored encrypted (server/security/secretBox) so administrators can show it again. A key reads shared
 * knowledge plus the knowledge of the clients it's assigned to (several allowed), or every client's.
 * Keys can be revoked; the routes check `settings.manage`.
 */

/** The stored form of a key (sha256, hex) — what /api/v1 looks keys up by */
export const hashApiKey = (secret: string) => createHash('sha256').update(secret, 'utf8').digest('hex')

const API_KEY_SELECT =
    'id, name, prefix, all_clients, secret_ciphertext, created_at, last_used_at, revoked_at, api_key_clients(client:clients(id, name)), creator:profiles!api_keys_created_by_fkey(display_name)'

interface ApiKeyRow {
    id: string
    name: string
    prefix: string
    all_clients: boolean
    secret_ciphertext: string | null
    created_at: string
    last_used_at: string | null
    revoked_at: string | null
    api_key_clients: { client: { id: string; name: string } | null }[]
    creator: { display_name: string } | null
}

const mapApiKey = (row: ApiKeyRow): ApiKey => ({
    id: row.id,
    name: row.name,
    prefix: row.prefix,
    allClients: row.all_clients,
    clients: row.all_clients
        ? []
        : row.api_key_clients
              .map((link) => link.client)
              .filter((client): client is { id: string; name: string } => !!client)
              .sort((a, b) => a.name.localeCompare(b.name)),
    canReveal: !!row.secret_ciphertext && !row.revoked_at,
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

/** Replaces the key's clients (none when it reads every client) */
async function setKeyClients(keyId: string, clientIds: string[]) {
    const db = supabaseAdmin()
    check(await db.from('api_key_clients').delete().eq('api_key_id', keyId), 'save the key’s clients')
    if (clientIds.length) {
        check(
            await db
                .from('api_key_clients')
                .insert(clientIds.map((clientId) => ({ api_key_id: keyId, client_id: clientId }))),
            'save the key’s clients',
        )
    }
}

/** Creates a key. The secret is in the result, and can be shown again later (revealApiKey). */
export async function createApiKey(admin: SessionUser, input: CreateApiKeyInput): Promise<CreatedApiKey> {
    const clientIds = input.allClients ? [] : await assertClientsExist(input.clientIds)
    const secret = `${API_KEY_PREFIX}${randomBytes(API_KEY_RANDOM_BYTES).toString('base64url')}`
    const inserted = unwrap(
        await supabaseAdmin()
            .from('api_keys')
            .insert({
                name: input.name,
                prefix: apiKeyDisplayPrefix(secret),
                key_hash: hashApiKey(secret),
                secret_ciphertext: sealSecret(secret),
                all_clients: input.allClients,
                created_by: admin.id,
            })
            .select('id')
            .single(),
        'create the API key',
    )
    await setKeyClients(inserted.id, clientIds)
    await recordAudit(admin.id, 'api_key.created', 'api_key', inserted.id, {
        name: input.name,
        allClients: input.allClients,
        clientIds,
    })
    const apiKey = await loadApiKey(inserted.id)
    if (!apiKey) throw keyNotFound()
    return { apiKey, secret }
}

/** Renames a key or changes what it may read; takes effect on the agent's next request */
export async function updateApiKey(admin: SessionUser, keyId: string, input: UpdateApiKeyInput): Promise<ApiKey> {
    const existing = await loadApiKey(keyId)
    if (!existing) throw keyNotFound()
    if (existing.revokedAt) throw new ConflictError('That key is revoked. Create a new one instead.', 'API_KEY_REVOKED')
    const clientIds = input.allClients ? [] : await assertClientsExist(input.clientIds)
    check(
        await supabaseAdmin()
            .from('api_keys')
            .update({ name: input.name, all_clients: input.allClients })
            .eq('id', keyId),
        'save the API key',
    )
    await setKeyClients(keyId, clientIds)
    await recordAudit(admin.id, 'api_key.updated', 'api_key', keyId, {
        name: input.name,
        allClients: input.allClients,
        clientIds,
    })
    return (await loadApiKey(keyId)) ?? existing
}

/** The key itself, for an administrator to copy again. Recorded in the audit log. */
export async function revealApiKey(admin: SessionUser, keyId: string): Promise<{ secret: string }> {
    const row = unwrapMaybe(
        await supabaseAdmin()
            .from('api_keys')
            .select('id, name, secret_ciphertext, revoked_at')
            .eq('id', keyId)
            .maybeSingle(),
        'load the API key',
    )
    if (!row) throw keyNotFound()
    if (row.revoked_at) throw new ConflictError('That key is revoked, so it can’t be used or shown.', 'API_KEY_REVOKED')
    const secret = row.secret_ciphertext ? openSecret(row.secret_ciphertext) : null
    if (!secret) {
        throw new ConflictError(
            'This key can’t be shown again: it was created before keys were stored for showing again (or the encryption key changed). Create a new key, update Copilot Studio, then revoke this one.',
            'API_KEY_NOT_REVEALABLE',
        )
    }
    await recordAudit(admin.id, 'api_key.revealed', 'api_key', keyId, { name: row.name })
    return { secret }
}

/** Revokes a key: agents using it get 401 from the next request on. Revoking twice is harmless. */
export async function revokeApiKey(admin: SessionUser, keyId: string): Promise<ApiKey> {
    const existing = await loadApiKey(keyId)
    if (!existing) throw keyNotFound()
    if (existing.revokedAt) return existing
    check(
        await supabaseAdmin()
            .from('api_keys')
            // A revoked key is never shown again, so its encrypted copy goes
            .update({ revoked_at: new Date().toISOString(), secret_ciphertext: null })
            .eq('id', keyId)
            .is('revoked_at', null),
        'revoke the API key',
    )
    await recordAudit(admin.id, 'api_key.revoked', 'api_key', keyId, { name: existing.name })
    return (await loadApiKey(keyId)) ?? existing
}
