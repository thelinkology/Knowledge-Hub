import { apiAuthHandler, readQuery } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { getBrds } from '@/server/actions/brds'
import { BrdsQuerySchema } from '@/@types/brds/Brd'

/** BRDs, newest first (?clientId=&intakeId=&audience=) */
export const GET = apiAuthHandler('requirements.manage', async (req) =>
    getJsonResponse(await getBrds(BrdsQuerySchema.parse(readQuery(req)))),
)
