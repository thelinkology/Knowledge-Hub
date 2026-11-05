import { create, type StateCreator, type StoreApi, type UseBoundStore } from 'zustand'

/**
 * The common shape of a store fed by an SWR provider (SWR → Zustand bridge, see useSyncResource):
 * the data plus loading / validating / error, and `refresh` to re-fetch after a mutation.
 */
export interface ResourceState<T> {
    data: T | undefined
    loading: boolean
    validating: boolean
    error: string | null
    refresh: () => Promise<unknown>
    setData: (data: T | undefined) => void
    setLoading: (loading: boolean, validating: boolean) => void
    setError: (error: string | null) => void
    setRefresh: (refresh: () => Promise<unknown>) => void
}

export const resourceSlice = <T, S extends ResourceState<T>>(
    set: Parameters<StateCreator<S>>[0],
): ResourceState<T> => ({
    data: undefined,
    loading: true,
    validating: false,
    error: null,
    refresh: async () => undefined,
    setData: (data) => set({ data } as Partial<S>),
    setLoading: (loading, validating) => set({ loading, validating } as Partial<S>),
    setError: (error) => set({ error } as Partial<S>),
    setRefresh: (refresh) => set({ refresh } as Partial<S>),
})

/** A single-instance resource store (e.g. the player's status) */
export const createResourceStore = <T>() => create<ResourceState<T>>()((set) => resourceSlice<T, ResourceState<T>>(set))

/**
 * Context-keyed stores (one per course / activity id). Returns the hook `(key, selector)` and an
 * imperative getter for event handlers.
 */
export function createKeyedStore<S>(factory: () => UseBoundStore<StoreApi<S>>) {
    const stores: Record<string, UseBoundStore<StoreApi<S>>> = {}
    const getStore = (key: string | null | undefined) => {
        const k = key || 'default'
        return stores[k] || (stores[k] = factory())
    }
    const useKeyedStore = <U>(key: string | null | undefined, selector: (state: S) => U): U => getStore(key)(selector)
    const getState = (key: string | null | undefined) => getStore(key).getState()
    return { useKeyedStore, getState }
}

export const createKeyedResourceStore = <T>() => createKeyedStore(() => createResourceStore<T>())
