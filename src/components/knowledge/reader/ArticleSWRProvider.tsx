'use client'

import { useSWRArticleView } from '@/services/knowledge'
import { useSWRProducts } from '@/services/clients'
import { useArticleViewStore, useProductsStore } from '@/stores/AppStores'
import useSyncResource from '@/utils/hooks/useSyncResource'
import type { ArticleView } from '@/@types/knowledge/Article'
import type { ProviderProps } from '@/@types/common'

interface ArticleSWRProviderProps extends ProviderProps {
    articleId: string
    view?: ArticleView
}

/** The reader view → useArticleViewStore(articleId); products → useProductsStore */
export default function ArticleSWRProvider({ articleId, view, children }: ArticleSWRProviderProps) {
    const swr = useSWRArticleView(articleId, { fallbackData: view })
    const setData = useArticleViewStore(articleId, (s) => s.setData)
    const setLoading = useArticleViewStore(articleId, (s) => s.setLoading)
    const setError = useArticleViewStore(articleId, (s) => s.setError)
    const setRefresh = useArticleViewStore(articleId, (s) => s.setRefresh)
    useSyncResource(swr, { setData, setLoading, setError, setRefresh })
    return <ProductsSWRProvider>{children}</ProductsSWRProvider>
}

/** Products (reference data) → useProductsStore. Wrap any page that shows product tags or pickers. */
export function ProductsSWRProvider({ children }: ProviderProps) {
    const swr = useSWRProducts()
    const setData = useProductsStore((s) => s.setData)
    const setLoading = useProductsStore((s) => s.setLoading)
    const setError = useProductsStore((s) => s.setError)
    const setRefresh = useProductsStore((s) => s.setRefresh)
    useSyncResource(swr, { setData, setLoading, setError, setRefresh })
    return <>{children}</>
}
