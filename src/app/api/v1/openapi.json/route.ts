import { apiHandler } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { buildOpenApiSpec } from '@/server/integrations/openapi'

/** The agent API's Swagger 2.0 description (public: it holds no data, only how to call the API) */
export const GET = apiHandler(async (req) => getJsonResponse(buildOpenApiSpec(req.nextUrl.host)))
