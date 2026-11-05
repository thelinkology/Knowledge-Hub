'use client'

import { useEffect } from 'react'
import useSession from './useSession'
import { ensureRecentItemsLoaded, useRecentItemsStore, type RecentItem } from '@/stores/RecentItemsStore'

/** Records a visit for the side nav's "Recently visited" (once the item has loaded). */
export default function useRecordRecentItem(item: RecentItem | null) {
    const { user } = useSession()
    const record = useRecentItemsStore((state) => state.record)
    const key = item ? JSON.stringify(item) : null
    useEffect(() => {
        if (!user || !key) return
        void ensureRecentItemsLoaded().then(() => record(user.id, JSON.parse(key) as RecentItem))
    }, [user, key, record])
}
