import { apiAuthHandler, readJsonBody } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { confirmMediaUpload, getMediaLibrary } from '@/server/actions/media'
import { ConfirmMediaUploadSchema } from '@/@types/media/KnowledgeMedia'

/** The image library (anyone who writes content: editors and admins) */
export const GET = apiAuthHandler('knowledge.manage', async () => getJsonResponse(await getMediaLibrary()))

/** Step 2 of an upload: the server checks the stored bytes and keeps the image */
export const POST = apiAuthHandler('knowledge.manage', async (req, _ctx, user) =>
    getJsonResponse(await confirmMediaUpload(user, ConfirmMediaUploadSchema.parse(await readJsonBody(req))), {
        status: 201,
    }),
)
