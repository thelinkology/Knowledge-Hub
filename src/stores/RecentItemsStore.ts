import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { RECENT_ITEMS_LIMIT, RECENT_ITEMS_STORAGE_KEY } from '@/constants/navigation.constant'

export interface RecentItem {
    id: string
    kind: 'article' | 'collection' | 'client' | 'asset' | 'brd'
    title: string
    subtitle?: string
    href: string
}

interface RecentItemsState {
    byUser: Record<string, RecentItem[]>
    record: (userId: string, item: RecentItem) => void
}

/** "Recently visited" in the side nav, per user, kept in localStorage (hydrated after first render). */
export const useRecentItemsStore = create<RecentItemsState>()(
    persist(
        (set) => ({
            byUser: {},
            record: (userId, item) =>
                set((state) => {
                    const current = (state.byUser[userId] ?? []).filter((i) => i.id !== item.id)
                    return { byUser: { ...state.byUser, [userId]: [item, ...current].slice(0, RECENT_ITEMS_LIMIT) } }
                }),
        }),
        { name: RECENT_ITEMS_STORAGE_KEY, skipHydration: true },
    ),
)

const EMPTY: RecentItem[] = []

export const selectRecentItems = (userId: string | undefined) => (state: RecentItemsState) =>
    (userId && state.byUser[userId]) || EMPTY

let hydrated = false
export async function ensureRecentItemsLoaded() {
    if (hydrated) return
    hydrated = true
    await useRecentItemsStore.persist.rehydrate()
}
