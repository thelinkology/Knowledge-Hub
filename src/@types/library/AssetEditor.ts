import type { Asset } from './Asset'
import type { ClientOption } from '@/@types/clients/Client'
import type { Product } from '@/@types/products/Product'

/** GET /api/assets/[assetId]/editor */
export interface AssetEditorData {
    asset: Asset
    clients: ClientOption[]
    products: Product[]
}
