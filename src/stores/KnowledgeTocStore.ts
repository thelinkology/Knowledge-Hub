import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { KNOWLEDGE_TOC_STORAGE_KEY } from '@/constants/knowledge.constant'

/*
 * Whether the article reader's table of contents is hidden (the « / » buttons). Remembered for this
 * browser session only. `skipHydration`: the server renders it shown and the saved choice is loaded after
 * mount (ArticleReader calls rehydrate), so the first paint matches the server.
 */

interface KnowledgeTocState {
    hidden: boolean
    setHidden: (hidden: boolean) => void
}

export const useKnowledgeTocStore = create<KnowledgeTocState>()(
    persist(
        (set) => ({
            hidden: false,
            setHidden: (hidden) => set({ hidden }),
        }),
        {
            name: KNOWLEDGE_TOC_STORAGE_KEY,
            storage: createJSONStorage(() => sessionStorage),
            skipHydration: true,
        },
    ),
)
