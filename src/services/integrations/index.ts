import useSWR, { type SWRConfiguration } from 'swr'
import api from '@/services/api'
import { tryParseDate } from '@/utils/parse'
import type { ApiKey, CreateApiKeyInput, CreatedApiKey, UpdateApiKeyInput } from '@/@types/integrations/ApiKey'

const ensureApiKey = (key: ApiKey): ApiKey => ({
    ...key,
    createdAt: tryParseDate(key.createdAt) as Date,
    lastUsedAt: tryParseDate(key.lastUsedAt),
    revokedAt: tryParseDate(key.revokedAt),
})

// ── Agent API keys (Administration → Copilot integration) ──

export const apiKeysUrl = '/admin/api-keys'

export const apiGetApiKeys = async () =>
    (await api.fetchJson<ApiKey[]>({ method: 'get', url: apiKeysUrl })).map(ensureApiKey)

export const useSWRApiKeys = (config?: SWRConfiguration<ApiKey[]>) => useSWR(apiKeysUrl, apiGetApiKeys, config)

/** The result holds the key itself — show it, never store it in the browser */
export const apiCreateApiKey = async (input: CreateApiKeyInput) => {
    const created = await api.fetchJson<CreatedApiKey>({ method: 'post', url: apiKeysUrl, data: input })
    return { ...created, apiKey: ensureApiKey(created.apiKey) }
}

export const apiRevokeApiKey = async (keyId: string) =>
    ensureApiKey(await api.fetchJson<ApiKey>({ method: 'delete', url: `${apiKeysUrl}/${keyId}` }))

export const apiUpdateApiKey = async (keyId: string, input: UpdateApiKeyInput) =>
    ensureApiKey(await api.fetchJson<ApiKey>({ method: 'patch', url: `${apiKeysUrl}/${keyId}`, data: input }))

/** The key itself, to copy again (recorded in the audit log) */
export const apiRevealApiKey = (keyId: string) =>
    api.fetchJson<{ secret: string }>({ method: 'post', url: `${apiKeysUrl}/${keyId}/reveal` })
