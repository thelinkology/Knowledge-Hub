import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import ArticleEditorSWRProvider from '@/components/knowledge/editor/ArticleEditorSWRProvider'
import ArticleEditorClientPage from '@/components/knowledge/editor/ArticleEditorClientPage'
import { getArticleEditor } from '@/server/actions/knowledge'
import { requirePagePermission } from '@/server/actions/auth'
import { isNotFound } from '@/server/utils/errors'
import { isUuid } from '@/utils/ids'

export const metadata: Metadata = { title: 'Edit article' }

interface ArticleEditPageProps {
    params: Promise<{ articleId: string }>
}

export default async function ArticleEditPage({ params }: ArticleEditPageProps) {
    await requirePagePermission('knowledge.manage')
    const { articleId } = await params
    if (!isUuid(articleId)) notFound()

    let editor
    try {
        editor = await getArticleEditor(articleId)
    } catch (error) {
        if (isNotFound(error)) notFound()
        throw error
    }

    return (
        <ArticleEditorSWRProvider articleId={articleId} editor={editor}>
            <ArticleEditorClientPage articleId={articleId} />
        </ArticleEditorSWRProvider>
    )
}
