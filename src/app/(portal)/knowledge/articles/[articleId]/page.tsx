import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import ArticleSWRProvider from '@/components/knowledge/reader/ArticleSWRProvider'
import ArticleClientPage from '@/components/knowledge/reader/ArticleClientPage'
import { getArticleView } from '@/server/actions/knowledge'
import { requirePagePermission } from '@/server/actions/auth'
import { isNotFound } from '@/server/utils/errors'
import { isUuid } from '@/utils/ids'

export const metadata: Metadata = { title: 'Article' }

interface ArticlePageProps {
    params: Promise<{ articleId: string }>
}

export default async function ArticlePage({ params }: ArticlePageProps) {
    const user = await requirePagePermission('knowledge.read')
    const { articleId } = await params
    if (!isUuid(articleId)) notFound()

    let view
    try {
        view = await getArticleView(user, articleId)
    } catch (error) {
        if (isNotFound(error)) notFound()
        throw error
    }

    return (
        <ArticleSWRProvider articleId={articleId} view={view}>
            <ArticleClientPage articleId={articleId} />
        </ArticleSWRProvider>
    )
}
