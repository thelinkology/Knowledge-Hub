import { apiAuthHandler, readQuery } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { getAuditEvents } from '@/server/actions/audit'
import { AuditQuerySchema } from '@/@types/audit/AuditEvent'

export const GET = apiAuthHandler('audit.view', async (req) =>
    getJsonResponse(await getAuditEvents(AuditQuerySchema.parse(readQuery(req)))),
)
