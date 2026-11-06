import { apiAuthHandler, readJsonBody } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { createDiagramComponent, getDiagramComponents } from '@/server/actions/diagramComponents'
import { DiagramComponentSchema } from '@/@types/library/DiagramComponent'

/** The architecture designer's component types (reference data for the diagram reader and designer) */
export const GET = apiAuthHandler('knowledge.read', async () => getJsonResponse(await getDiagramComponents()))

export const POST = apiAuthHandler('knowledge.manage', async (req, _ctx, user) =>
    getJsonResponse(await createDiagramComponent(user, DiagramComponentSchema.parse(await readJsonBody(req))), {
        status: 201,
    }),
)
