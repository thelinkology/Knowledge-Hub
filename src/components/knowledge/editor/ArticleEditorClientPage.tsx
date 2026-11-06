'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Dropdown from '@/components/ui/Dropdown'
import LinkButton from '@/components/ui/LinkButton'
import Tabs from '@/components/ui/Tabs'
import Tooltip from '@/components/ui/Tooltip'
import { Form } from '@/components/ui/Form'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import ErrorState from '@/components/shared/ErrorState'
import Loading from '@/components/shared/Loading'
import PageHeader from '@/components/shared/PageHeader'
import PublishChecklist from '@/components/shared/PublishChecklist'
import MarkdownBodyEditor from '@/components/shared/editor/MarkdownBodyEditor'
import { ArticleKindTag, PublishStatusTag } from '@/components/shared/KnowledgeTags'
import ArticleDetailsFields, { ArticleTitleFields } from './ArticleDetailsFields'
import ArticleReader from '../reader/ArticleReader'
import RevisionHistoryDialog from './RevisionHistoryDialog'
import ArticleOutlinePreview from './ArticleOutlinePreview'
import { ARTICLE_FIELD_IDS, toFormData, toSaveInput } from './articleForm'
import { DeleteIcon, ExpandIcon, HistoryIcon, PreviewIcon, SaveIcon, EditIcon } from '@/configs/icons.config'
import { apiDeleteArticle, apiSaveArticle, apiSetArticleStatus } from '@/services/knowledge'
import { useArticleEditorStore } from '@/stores/AppStores'
import { getArticlePath, getCollectionPath, knowledgePath } from '@/configs/app.config'
import { ArticleFormSchema, type ArticleFormData } from '@/@types/knowledge/forms/ArticleFormData'
import { getPublishIssues } from '@/utils/articleValidation'
import { ancestorsOf } from '@/utils/articleTree'
import { getErrorCode, tryGetErrorMessage } from '@/utils/errors'
import { usePageBreadcrumbs } from '@/utils/hooks/useBreadcrumbs'
import useUnsavedChangesGuard from '@/utils/hooks/useUnsavedChangesGuard'
import { formatDateTime } from '@/utils/dates'
import type { PublishStatus } from '@/@types/shared/PublishStatusOptions'
import type { ArticleEditorData } from '@/@types/knowledge/ArticleEditor'

const FORM_ID = 'article-editor-form'

interface ArticleEditorClientPageProps {
    articleId: string
}

/** The article editor: write, preview, save versions and publish one article */
export default function ArticleEditorClientPage({ articleId }: ArticleEditorClientPageProps) {
    const data = useArticleEditorStore(articleId, (s) => s.data)
    const error = useArticleEditorStore(articleId, (s) => s.error)
    const refresh = useArticleEditorStore(articleId, (s) => s.refresh)

    if (!data)
        return error ? (
            <ErrorState message={error} onRetry={() => void refresh()} />
        ) : (
            <Loading loading message="Opening the editor…" />
        )
    // The form is created once from the loaded data and reset only after our own saves
    return <ArticleEditor key={articleId} data={data} />
}

const STATUS_CONFIRM: Partial<Record<PublishStatus, { title: string; body: string; confirm: string }>> = {
    draft: {
        title: 'Unpublish this article?',
        body: 'Viewers and Copilot will no longer find it. You can publish it again at any time.',
        confirm: 'Unpublish',
    },
    archived: {
        title: 'Archive this article?',
        body: 'It’s hidden from browsing, search and Copilot. Its history is kept and you can restore it later.',
        confirm: 'Archive',
    },
}

function ArticleEditor({ data }: { data: ArticleEditorData }) {
    const router = useRouter()
    const { article } = data
    const articleId = article.id
    const setData = useArticleEditorStore(articleId, (s) => s.setData)
    const [tab, setTab] = useState('write')
    const [busy, setBusy] = useState(false)
    const [pendingStatus, setPendingStatus] = useState<PublishStatus | null>(null)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [historyOpen, setHistoryOpen] = useState(false)
    const [conflict, setConflict] = useState(false)

    const form = useForm<ArticleFormData>({
        resolver: zodResolver(ArticleFormSchema),
        defaultValues: toFormData(article),
        mode: 'onBlur',
    })
    const {
        control,
        formState: { isDirty, isSubmitting },
    } = form
    const values = useWatch({ control }) as ArticleFormData

    const ancestors = useMemo(
        () => ancestorsOf(data.collectionArticles, articleId),
        [data.collectionArticles, articleId],
    )
    const childCount = data.collectionArticles.filter((a) => a.parentId === articleId).length

    usePageBreadcrumbs([
        { label: 'Knowledge', href: knowledgePath },
        ...(article.collectionId && article.collectionTitle
            ? [{ label: article.collectionTitle, href: getCollectionPath(article.collectionId) }]
            : []),
        ...ancestors.map((a) => ({ label: a.title, href: getArticlePath(a.id) })),
        { label: article.title, href: getArticlePath(articleId) },
        { label: 'Edit' },
    ])

    const issues = useMemo(
        () => getPublishIssues({ title: values.title ?? '', summary: values.summary ?? '', body: values.body ?? '' }),
        [values.title, values.summary, values.body],
    )

    const applySaved = useCallback(
        (saved: ArticleEditorData) => {
            setData(saved)
            form.reset(toFormData(saved.article))
        },
        [setData, form],
    )

    const save = useCallback(
        async (formValues: ArticleFormData) => {
            try {
                // data.article.version is the version this form was loaded from (the server refuses stale saves)
                applySaved(await apiSaveArticle(articleId, toSaveInput(formValues, data.article.version)))
                toastSuccess('Saved.', { duration: 3000 })
                return true
            } catch (e) {
                if (getErrorCode(e) === 'ARTICLE_CHANGED') setConflict(true)
                else toastError(`Couldn’t save. ${tryGetErrorMessage(e)}`)
                return false
            }
        },
        [articleId, applySaved, data.article.version],
    )

    /** Validates and saves; resolves false (with the fields highlighted) when the form is invalid */
    const saveNow = useCallback(
        () =>
            new Promise<boolean>((resolve) => {
                void form.handleSubmit(
                    async (formValues) => resolve(await save(formValues)),
                    () => {
                        setTab('write')
                        toastError('Some fields need attention — they’re highlighted in the form.')
                        resolve(false)
                    },
                )()
            }),
        [form, save],
    )

    // Ctrl/Cmd+S saves
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault()
                void saveNow()
            }
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [saveNow])

    // Warn before closing the tab or following an in-app link with unsaved work
    const guard = useUnsavedChangesGuard(() => form.formState.isDirty)

    const changeStatus = async (status: PublishStatus) => {
        setBusy(true)
        try {
            if (form.formState.isDirty && !(await saveNow())) return
            applySaved(await apiSetArticleStatus(articleId, status))
            toastSuccess(
                status === 'published'
                    ? 'Published — people and Copilot can find it now.'
                    : status === 'archived'
                      ? 'Archived.'
                      : 'Moved back to draft.',
            )
            setPendingStatus(null)
        } catch (e) {
            toastError(`Couldn’t change the status. ${tryGetErrorMessage(e)}`)
        } finally {
            setBusy(false)
        }
    }

    const remove = async () => {
        setBusy(true)
        try {
            await apiDeleteArticle(articleId)
            form.reset(form.getValues()) // nothing to guard any more
            toastSuccess('Article deleted.')
            router.push(article.collectionId ? getCollectionPath(article.collectionId) : knowledgePath)
        } catch (e) {
            toastError(`Couldn’t delete the article. ${tryGetErrorMessage(e)}`)
            setBusy(false)
        }
    }

    const publishBlocked = issues.length > 0
    const publishButton = (
        <Button
            size="sm"
            variant="solid"
            disabled={publishBlocked || busy}
            loading={busy && !pendingStatus}
            onClick={() => void changeStatus('published')}
        >
            {article.status === 'archived' ? 'Restore & publish' : 'Publish'}
        </Button>
    )

    // What the reader tab shows: the form's current values on top of the stored article
    const previewArticle = {
        ...article,
        title: values.title ?? article.title,
        summary: values.summary ?? '',
        body: values.body ?? '',
        kind: values.kind ?? article.kind,
        audience: values.audience ?? article.audience,
    }

    return (
        <FormProvider {...form}>
            <PageHeader
                eyebrow="Article editor"
                title={values.title || article.title}
                description={
                    <span className="flex flex-wrap items-center gap-2">
                        <ArticleKindTag kind={values.kind ?? article.kind} />
                        <PublishStatusTag status={article.status} />
                        <span className="text-sm" aria-live="polite">
                            {isDirty ? (
                                <span className="font-semibold text-warning">Unsaved changes</span>
                            ) : (
                                `Version ${article.version} · saved ${formatDateTime(article.updatedAt)}${article.updatedByName ? ` by ${article.updatedByName}` : ''}`
                            )}
                        </span>
                    </span>
                }
                actions={
                    <>
                        <Button size="sm" icon={<HistoryIcon />} onClick={() => setHistoryOpen(true)}>
                            History
                        </Button>
                        {article.status === 'published' && (
                            <LinkButton size="sm" href={getArticlePath(articleId)} icon={<PreviewIcon />}>
                                View
                            </LinkButton>
                        )}
                        <Button
                            size="sm"
                            type="submit"
                            form={FORM_ID}
                            icon={<SaveIcon />}
                            loading={isSubmitting}
                            disabled={!isDirty}
                        >
                            Save
                        </Button>
                        {article.status === 'published' ? (
                            <Dropdown
                                placement="bottom-end"
                                renderTitle={
                                    <Button size="sm" variant="solid" icon={<ExpandIcon />} iconAlignment="end">
                                        Published
                                    </Button>
                                }
                            >
                                <Dropdown.Item eventKey="draft" onClick={() => setPendingStatus('draft')}>
                                    Unpublish (back to draft)
                                </Dropdown.Item>
                                <Dropdown.Item eventKey="archive" onClick={() => setPendingStatus('archived')}>
                                    Archive
                                </Dropdown.Item>
                            </Dropdown>
                        ) : publishBlocked ? (
                            <Tooltip title={`Can’t publish yet: ${issues[0].message}`}>{publishButton}</Tooltip>
                        ) : (
                            publishButton
                        )}
                        {article.status === 'draft' && (
                            <Button size="sm" variant="plain" onClick={() => setPendingStatus('archived')}>
                                Archive
                            </Button>
                        )}
                        {article.status !== 'published' && (
                            <Button
                                size="sm"
                                variant="plain"
                                icon={<DeleteIcon />}
                                aria-label="Delete article"
                                onClick={() => setConfirmDelete(true)}
                            />
                        )}
                    </>
                }
            />

            {conflict && (
                <Alert showIcon type="warning" className="mb-4" closable onClose={() => setConflict(false)}>
                    Someone else saved this article while you were editing, so your save was stopped to protect their
                    changes. Copy what you wrote, reload the page, then apply it again.
                </Alert>
            )}

            <Tabs value={tab} onChange={setTab}>
                <Tabs.TabList className="mb-6">
                    <Tabs.TabNav value="write" icon={<EditIcon />}>
                        Write
                    </Tabs.TabNav>
                    <Tabs.TabNav value="preview" icon={<PreviewIcon />}>
                        Reader preview
                    </Tabs.TabNav>
                </Tabs.TabList>
                <Tabs.TabContent value="write">
                    <Form id={FORM_ID} onSubmit={form.handleSubmit(save)} noValidate>
                        <div className="grid gap-6 lg:grid-cols-3">
                            <div className="space-y-6 lg:col-span-2">
                                <Card>
                                    <ArticleTitleFields />
                                    <MarkdownBodyEditor<ArticleFormData>
                                        name="body"
                                        id={ARTICLE_FIELD_IDS.body}
                                        label="Content"
                                        hint="Text, images, videos, callouts, code and tables"
                                    />
                                </Card>
                            </div>
                            <aside className="space-y-6">
                                <Card
                                    header={{
                                        content: article.status === 'published' ? 'Checklist' : 'Publish checklist',
                                    }}
                                >
                                    <PublishChecklist
                                        issues={issues}
                                        published={article.status === 'published'}
                                        fieldIds={ARTICLE_FIELD_IDS}
                                    />
                                </Card>
                                <Card header={{ content: 'Details' }}>
                                    <ArticleDetailsFields data={data} />
                                </Card>
                                <Card header={{ content: 'In this article' }}>
                                    <ArticleOutlinePreview body={values.body ?? ''} />
                                </Card>
                            </aside>
                        </div>
                    </Form>
                </Tabs.TabContent>
                <Tabs.TabContent value="preview">
                    <ArticleReader article={previewArticle} collection={null} products={data.products} preview />
                </Tabs.TabContent>
            </Tabs>

            <RevisionHistoryDialog
                articleId={articleId}
                currentVersion={article.version}
                isOpen={historyOpen}
                onClose={() => setHistoryOpen(false)}
                onRestored={applySaved}
                dirty={isDirty}
            />
            <ConfirmDialog
                isOpen={!!pendingStatus}
                onClose={() => setPendingStatus(null)}
                type="warning"
                title={pendingStatus ? STATUS_CONFIRM[pendingStatus]?.title : ''}
                confirmText={pendingStatus ? STATUS_CONFIRM[pendingStatus]?.confirm : 'Confirm'}
                onConfirm={() => pendingStatus && void changeStatus(pendingStatus)}
                loading={busy}
            >
                {pendingStatus && STATUS_CONFIRM[pendingStatus]?.body}
            </ConfirmDialog>
            <ConfirmDialog
                isOpen={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                type="danger"
                title="Delete this article?"
                confirmText="Delete permanently"
                onConfirm={() => void remove()}
                loading={busy}
            >
                The article and all of its versions are deleted. This can’t be undone. (Archiving keeps it instead.)
                {childCount > 0 &&
                    ` Its ${childCount === 1 ? 'sub-article moves' : `${childCount} sub-articles move`} to the top level of the collection.`}
            </ConfirmDialog>
            <ConfirmDialog
                isOpen={!!guard.pendingHref}
                onClose={guard.stay}
                type="warning"
                title="Leave without saving?"
                confirmText="Leave"
                cancelText="Stay and save"
                onConfirm={guard.leave}
            >
                You have unsaved changes. If you leave now, they’ll be lost.
            </ConfirmDialog>
        </FormProvider>
    )
}
