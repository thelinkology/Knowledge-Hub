import { create } from 'zustand'
import { createKeyedResourceStore, createResourceStore, resourceSlice, type ResourceState } from './createResourceStore'
import type { Asset, AssetKind, AssetSummary } from '@/@types/library/Asset'
import type { AssetEditorData } from '@/@types/library/AssetEditor'
import type { DiagramComponent } from '@/@types/library/DiagramComponent'
import type { ClientStatus, ClientSummary } from '@/@types/clients/Client'
import type { PersonOption } from '@/@types/users/UserAccount'

/*
 * Library and client-page stores, fed by the *SWRProviders in components/library and components/clients
 * (SWR → Zustand bridge, see useSyncResource). After a mutation, call the store's refresh().
 */

// ── Library browse ──

export interface LibraryQueryState {
    q: string
    clientId: string | null
    productId: string | null
    /** Applied in the browser, so every kind's count stays visible */
    kind: AssetKind | null
}

interface LibraryState extends ResourceState<AssetSummary[]> {
    query: LibraryQueryState
    setQuery: (query: Partial<LibraryQueryState>) => void
}

export const useLibraryStore = create<LibraryState>()((set) => ({
    ...resourceSlice<AssetSummary[], LibraryState>(set),
    query: { q: '', clientId: null, productId: null, kind: null },
    setQuery: (query) => set((state) => ({ query: { ...state.query, ...query } })),
}))

/** Every client (names for the library's filter and pickers) */
export const useClientOptionsStore = createResourceStore<ClientSummary[]>()

// ── One asset ──

const assetStores = createKeyedResourceStore<Asset>()
export const useAssetStore = assetStores.useKeyedStore
export const getAssetState = assetStores.getState

const assetEditorStores = createKeyedResourceStore<AssetEditorData>()
export const useAssetEditorStore = assetEditorStores.useKeyedStore
export const getAssetEditorState = assetEditorStores.getState

/** Architecture diagram component types (the designer's palette, colours and icons for every diagram) */
export const useDiagramComponentsStore = createResourceStore<DiagramComponent[]>()

// ── Clients ──

/** Editors and admins, for the client owner picker */
export const usePeopleStore = createResourceStore<PersonOption[]>()

/** The clients list's search and status filter (the results go to AppStores.useClientsStore) */

export interface ClientsQueryState {
    q: string
    status: ClientStatus | null
}

interface ClientsQueryStore {
    query: ClientsQueryState
    setQuery: (query: Partial<ClientsQueryState>) => void
}

export const useClientsQueryStore = create<ClientsQueryStore>()((set) => ({
    query: { q: '', status: null },
    setQuery: (query) => set((state) => ({ query: { ...state.query, ...query } })),
}))
