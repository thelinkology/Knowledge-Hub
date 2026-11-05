import { apiAuthHandler, readId, readJsonBody } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { updateProduct } from '@/server/actions/products'
import { ProductSchema } from '@/@types/products/Product'

export const PUT = apiAuthHandler<{ productId: string }>('settings.manage', async (req, ctx, user) => {
    const productId = readId((await ctx.params).productId, 'product')
    return getJsonResponse(await updateProduct(user, productId, ProductSchema.parse(await readJsonBody(req))))
})
