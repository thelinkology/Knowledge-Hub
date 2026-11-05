import { apiAuthHandler, readJsonBody } from '@/server/routes/api'
import { getJsonResponse } from '@/server/utils/response'
import { createProduct, getProducts } from '@/server/actions/products'
import { ProductSchema } from '@/@types/products/Product'

/** Every product (reference data for filters and pickers) */
export const GET = apiAuthHandler('knowledge.read', async () => getJsonResponse(await getProducts()))

export const POST = apiAuthHandler('settings.manage', async (req, _ctx, user) =>
    getJsonResponse(await createProduct(user, ProductSchema.parse(await readJsonBody(req))), { status: 201 }),
)
