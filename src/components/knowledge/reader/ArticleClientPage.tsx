'use client'

import LinkButton from '@/components/ui/LinkButton'
import Button from '@/components/ui/Button'
import ErrorState from '@/components/shared/ErrorState'
import Loading from '@/components/shared/Loading'
import ArticleReader from './ArticleReader'
import { EditIcon, PrintIcon } from '@/configs/icons.config'
import { getArticleEditPath, getArticlePath, getCollectionPath, knowledgePath } from '@/configs/app.config'
import { useArticleViewStore, useProductsStore } from '@/stores/AppStores'
import useSession from '@/utils/hooks/useSession'
import { usePageBreadcrumbs } from '@/utils/hooks/useBreadcrumbs'
import useRecordRecentItem from '@/utils/hooks/useRecordRecentItem'

interface ArticleClientPageProps {
    articleId: string
}

/** Reading one article */
export default function ArticleClientPage({ articleId }: ArticleClientPageProps) {
    const { can } = useSession()
    const view = useArticleViewStore(articleId, (s) => s.data)
    const error = useArticleViewStore(articleId, (s) => s.error)
    const refresh = useArticleViewStore(articleId, (s) => s.refresh)
    const products = useProductsStore((s) => s.data)

    usePageBreadcrumbs([
        { label: 'Knowledge', href: knowledgePath },
        ...(view?.collection ? [{ label: view.collection.title, href: getCollectionPath(view.collection.id) }] : []),
        { label: view?.article.title ?? 'Article' },
    ])
    useRecordRecentItem(
        view
            ? {
                  id: articleId,
                  kind: 'article',
                  title: view.article.title,
                  subtitle: view.collection?.title,
                  href: getArticlePath(articleId),
              }
            : null,
    )

    if (!view)
        return error ? (
            <ErrorState message={error} onRetry={() => void refresh()} />
        ) : (
            <Loading loading message="Opening the article…" />
        )

    return (
        <>
            <div className="no-print mb-4 flex justify-end gap-2">
                <Button size="sm" variant="plain" icon={<PrintIcon />} onClick={() => window.print()}>
                    Print or save as PDF
                </Button>
                {can('knowledge.manage') && (
                    <LinkButton size="sm" href={getArticleEditPath(articleId)} icon={<EditIcon />}>
                        Edit
                    </LinkButton>
                )}
            </div>
            <ArticleReader article={view.article} collection={view.collection} products={products} />
        </>
    )
}
