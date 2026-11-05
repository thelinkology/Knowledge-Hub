import { apiAuthHandler, readJsonBody } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { prepareMediaUpload } from '@/server/actions/media'
import { PrepareMediaUploadSchema } from '@/@types/media/KnowledgeMedia'

/** Step 1 of an upload: a one-time URL for a path the server chooses */
export const POST = apiAuthHandler('knowledge.manage', async (req, _ctx, user) =>
    getJsonResponse(await prepareMediaUpload(user, PrepareMediaUploadSchema.parse(await readJsonBody(req)))),
)
