import { createResourceStore } from './createResourceStore'
import type { Product } from '@/@types/products/Product'
import type { ApiKey } from '@/@types/integrations/ApiKey'

/* Settings pages (Administration → Products, Copilot integration), filled by their *SWRProviders. */

/** Every product, inactive ones too */
export const useAdminProductsStore = createResourceStore<Product[]>()

/** Agent API keys, active and revoked */
export const useApiKeysStore = createResourceStore<ApiKey[]>()
