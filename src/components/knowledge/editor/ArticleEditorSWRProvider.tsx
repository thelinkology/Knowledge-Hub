'use client'

import { useSWRArticleEditor } from '@/services/knowledge'
import { useArticleEditorStore } from '@/stores/AppStores'
import useSyncResource from '@/utils/hooks/useSyncResource'
import type { ArticleEditorData } from '@/@types/knowledge/ArticleEditor'
import type { ProviderProps } from '@/@types/common'

interface ArticleEditorSWRProviderProps extends ProviderProps {
    articleId: string
    /** Server-rendered first load */
    editor?: ArticleEditorData
}

/** Article editor data (article, collections, clients, products) → useArticleEditorStore(articleId) */
export default function ArticleEditorSWRProvider({ articleId, editor, children }: ArticleEditorSWRProviderProps) {
    // No refetch on focus: the form is the working copy; the store is refreshed explicitly after saves
    const swr = useSWRArticleEditor(articleId, { fallbackData: editor, revalidateOnFocus: false })
    const setData = useArticleEditorStore(articleId, (s) => s.setData)
    const setLoading = useArticleEditorStore(articleId, (s) => s.setLoading)
    const setError = useArticleEditorStore(articleId, (s) => s.setError)
    const setRefresh = useArticleEditorStore(articleId, (s) => s.setRefresh)
    useSyncResource(swr, { setData, setLoading, setError, setRefresh })
    return <>{children}</>
}
