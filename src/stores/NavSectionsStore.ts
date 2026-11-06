import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { NAV_SECTIONS_STORAGE_KEY } from '@/constants/navigation.constant'

/*
 * Which side-navigation sections (Workspace, Requirements, Administration) are collapsed. Remembered in
 * this browser only. `skipHydration`: the server renders everything expanded and the saved state is
 * loaded after mount (VerticalMenuContent calls rehydrate), so the first paint matches the server.
 */

interface NavSectionsState {
    collapsed: Record<string, boolean>
    toggle: (key: string) => void
}

export const useNavSectionsStore = create<NavSectionsState>()(
    persist(
        (set) => ({
            collapsed: {},
            toggle: (key) => set((state) => ({ collapsed: { ...state.collapsed, [key]: !state.collapsed[key] } })),
        }),
        {
            name: NAV_SECTIONS_STORAGE_KEY,
            storage: createJSONStorage(() => localStorage),
            skipHydration: true,
        },
    ),
)
