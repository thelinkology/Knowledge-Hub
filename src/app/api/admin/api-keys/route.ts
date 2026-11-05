import { apiAuthHandler, readJsonBody } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { createApiKey, listApiKeys } from '@/server/actions/integrations'
import { CreateApiKeySchema } from '@/@types/integrations/ApiKey'

/** Agent API keys (Copilot Studio). Only hashes are stored; the key is returned once, on creation. */
export const GET = apiAuthHandler('settings.manage', async () => getJsonResponse(await listApiKeys()))

export const POST = apiAuthHandler('settings.manage', async (req, _ctx, user) =>
    getJsonResponse(await createApiKey(user, CreateApiKeySchema.parse(await readJsonBody(req))), { status: 201 }),
)
