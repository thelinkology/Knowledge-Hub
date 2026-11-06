import { apiAuthHandler, readId, readJsonBody } from '@/server/routes/api'
import { getEmptyResponse, getJsonResponse } from '@/server/utils/response'
import { deleteDiagramComponent, updateDiagramComponent } from '@/server/actions/diagramComponents'
import { DiagramComponentSchema } from '@/@types/library/DiagramComponent'

export const PUT = apiAuthHandler<{ componentId: string }>('knowledge.manage', async (req, ctx, user) => {
    const componentId = readId((await ctx.params).componentId, 'component type')
    return getJsonResponse(
        await updateDiagramComponent(user, componentId, DiagramComponentSchema.parse(await readJsonBody(req))),
    )
})

export const DELETE = apiAuthHandler<{ componentId: string }>('knowledge.manage', async (_req, ctx, user) => {
    await deleteDiagramComponent(user, readId((await ctx.params).componentId, 'component type'))
    return getEmptyResponse()
})
