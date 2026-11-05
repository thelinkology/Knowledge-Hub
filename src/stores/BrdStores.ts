import { createKeyedResourceStore } from './createResourceStore'
import type { Brd } from '@/@types/brds/Brd'

/*
 * BRD stores, fed by BrdSWRProvider (SWR → Zustand bridge, see useSyncResource). The BRD page and the
 * editor read one BRD by id; lists are page-local and read SWR directly (BrdList).
 */

const brdStores = createKeyedResourceStore<Brd>()
export const useBrdStore = brdStores.useKeyedStore
export const getBrdState = brdStores.getState
