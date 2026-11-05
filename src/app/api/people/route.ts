import { apiAuthHandler } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { getPeople } from '@/server/actions/users'

/** Editors and admins, for owner pickers */
export const GET = apiAuthHandler('clients.manage', async () => getJsonResponse(await getPeople()))
