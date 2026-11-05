import { createKeyedResourceStore, createResourceStore } from './createResourceStore'
import type { ArticleEditorData } from '@/@types/knowledge/ArticleEditor'
import type { ArticleView } from '@/@types/knowledge/Article'
import type { Client, ClientSummary } from '@/@types/clients/Client'
import type { Product } from '@/@types/products/Product'
import type { CollectionDetail } from '@/services/knowledge'
import type { HomeOverview } from '@/@types/reports/Overview'

/*
 * Resource stores fed by the *SWRProviders (SWR → Zustand bridge, see useSyncResource). Leaf
 * components read them with selectors; after a mutation, call the store's refresh().
 * Feature slices add their stores here.
 */

// ── Reference data ──
export const useProductsStore = createResourceStore<Product[]>()

// ── Knowledge ──
const articleEditorStores = createKeyedResourceStore<ArticleEditorData>()
export const useArticleEditorStore = articleEditorStores.useKeyedStore
export const getArticleEditorState = articleEditorStores.getState

const articleViewStores = createKeyedResourceStore<ArticleView>()
export const useArticleViewStore = articleViewStores.useKeyedStore
export const getArticleViewState = articleViewStores.getState

const collectionStores = createKeyedResourceStore<CollectionDetail>()
export const useCollectionStore = collectionStores.useKeyedStore
export const getCollectionState = collectionStores.getState

// ── Clients ──
export const useClientsStore = createResourceStore<ClientSummary[]>()

const clientStores = createKeyedResourceStore<Client>()
export const useClientStore = clientStores.useKeyedStore
export const getClientState = clientStores.getState

// ── Home ──
export const useHomeStore = createResourceStore<HomeOverview>()
