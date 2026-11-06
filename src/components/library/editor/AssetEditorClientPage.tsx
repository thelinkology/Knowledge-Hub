'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { AssetKindTag, PublishStatusTag } from '@/components/shared/KnowledgeTags'
import AssetDetailsFields, { AssetCodeFields, AssetTitleFields } from './AssetDetailsFields'
import AssetReader from '../reader/AssetReader'
import DiagramEditor from './diagram/DiagramEditor'
import { ASSET_FIELD_IDS, toFormData, toSaveInput } from './assetForm'
import { DeleteIcon, DiagramIcon, EditIcon, ExpandIcon, PreviewIcon, SaveIcon } from '@/configs/icons.config'
import { apiDeleteAsset, apiSaveAsset } from '@/services/library'
import { useAssetEditorStore } from '@/stores/LibraryStores'
import { getAssetPath, libraryPath } from '@/configs/app.config'
import { AssetFormSchema, type AssetFormData } from '@/@types/library/forms/AssetFormData'
import { getPublishIssues } from '@/utils/articleValidation'
import { tryGetErrorMessage } from '@/utils/errors'
import { usePageBreadcrumbs } from '@/utils/hooks/useBreadcrumbs'
import useUnsavedChangesGuard from '@/utils/hooks/useUnsavedChangesGuard'
import { formatDateTime } from '@/utils/dates'
import type { PublishStatus } from '@/@types/shared/PublishStatusOptions'
import type { AssetEditorData } from '@/@types/library/AssetEditor'
import type { Asset } from '@/@types/library/Asset'

const FORM_ID = 'asset-editor-form'

interface AssetEditorClientPageProps {
    assetId: string
}

/** The asset editor: describe, preview and publish one library asset */
export default function AssetEditorClientPage({ assetId }: AssetEditorClientPageProps) {
    const data = useAssetEditorStore(assetId, (s) => s.data)
    const error = useAssetEditorStore(assetId, (s) => s.error)
    const refresh = useAssetEditorStore(assetId, (s) => s.refresh)

    if (!data)
        return error ? (
            <ErrorState message={error} onRetry={() => void refresh()} />
        ) : (
            <Loading loading message="Opening the editor…" />
        )
    // The form is created once from the loaded data and reset only after our own saves
    return <AssetEditor key={assetId} data={data} />
}

const STATUS_CONFIRM: Partial<Record<PublishStatus, { title: string; body: string; confirm: string }>> = {
    draft: {
        title: 'Unpublish this asset?',
        body: 'Viewers and Copilot will no longer find it. You can publish it again at any time.',
        confirm: 'Unpublish',
    },
    archived: {
        title: 'Archive this asset?',
        body: 'It’s hidden from the library, search and Copilot. You can restore it later.',
        confirm: 'Archive',
    },
}

const STATUS_TOAST: Record<PublishStatus, string> = {
    published: 'Published — people and Copilot can find it now.',
    draft: 'Moved back to draft.',
    archived: 'Archived.',
}

function AssetEditor({ data }: { data: AssetEditorData }) {
    const router = useRouter()
    const { asset } = data
    const assetId = asset.id
    const setData = useAssetEditorStore(assetId, (s) => s.setData)
    // A reference architecture opens on its diagram
    const [tab, setTab] = useState(asset.kind === 'reference_architecture' ? 'diagram' : 'write')
    const [busy, setBusy] = useState(false)
    const [pendingStatus, setPendingStatus] = useState<PublishStatus | null>(null)
    const [confirmDelete, setConfirmDelete] = useState(false)

    const form = useForm<AssetFormData>({
        resolver: zodResolver(AssetFormSchema),
        defaultValues: toFormData(asset),
        mode: 'onBlur',
    })
    const {
        control,
        formState: { isDirty, isSubmitting },
    } = form
    const values = useWatch({ control }) as AssetFormData

    const isArchitecture = (values.kind ?? asset.kind) === 'reference_architecture'
    const activeTab = tab === 'diagram' && !isArchitecture ? 'write' : tab

    usePageBreadcrumbs([
        { label: 'Library', href: libraryPath },
        { label: asset.title, href: getAssetPath(assetId) },
        { label: 'Edit' },
    ])

    const issues = useMemo(
        () => getPublishIssues({ title: values.title ?? '', summary: values.summary ?? '', body: values.body ?? '' }),
        [values.title, values.summary, values.body],
    )

    const applySaved = useCallback(
        (saved: AssetEditorData) => {
            setData(saved)
            form.reset(toFormData(saved.asset))
        },
        [setData, form],
    )

    /** Saves the form with a status (the current one for a plain save) */
    const persist = useCallback(
        async (formValues: AssetFormData, status: PublishStatus) =>
            applySaved(await apiSaveAsset(assetId, toSaveInput(formValues, status))),
        [assetId, applySaved],
    )

    const save = useCallback(
        async (formValues: AssetFormData) => {
            try {
                await persist(formValues, asset.status)
                toastSuccess('Saved.', { duration: 3000 })
                return true
            } catch (e) {
                toastError(`Couldn’t save. ${tryGetErrorMessage(e)}`)
                return false
            }
        },
        [persist, asset.status],
    )

    /** Validates the form; resolves its values, or null (with the fields highlighted) */
    const validate = useCallback(
        () =>
            new Promise<AssetFormData | null>((resolve) => {
                void form.handleSubmit(
                    (formValues) => resolve(formValues),
                    (errors) => {
                        // Only the diagram is wrong: show it (its problems are listed under the canvas)
                        const diagramOnly = Object.keys(errors).every((key) => key === 'diagram')
                        setTab(diagramOnly && form.getValues('kind') === 'reference_architecture' ? 'diagram' : 'write')
                        toastError('Some fields need attention — they’re highlighted in the form.')
                        resolve(null)
                    },
                )()
            }),
        [form],
    )

    const saveNow = useCallback(async () => {
        const formValues = await validate()
        return formValues ? save(formValues) : false
    }, [validate, save])

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

    /** Publishing, unpublishing and archiving save the form's current values at the same time */
    const changeStatus = async (status: PublishStatus) => {
        setBusy(true)
        try {
            const formValues = await validate()
            if (!formValues) return
            await persist(formValues, status)
            toastSuccess(STATUS_TOAST[status])
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
            await apiDeleteAsset(assetId)
            form.reset(form.getValues()) // nothing to guard any more
            toastSuccess('Asset deleted.')
            router.push(libraryPath)
        } catch (e) {
            toastError(`Couldn’t delete the asset. ${tryGetErrorMessage(e)}`)
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
            {asset.status === 'archived' ? 'Restore & publish' : 'Publish'}
        </Button>
    )

    // What the preview tab shows: the form's current values on top of the stored asset
    const clientName = values.clientId ? (data.clients.find((c) => c.id === values.clientId)?.name ?? null) : null
    const previewAsset: Asset = {
        ...asset,
        title: values.title ?? asset.title,
        kind: values.kind ?? asset.kind,
        summary: values.summary ?? '',
        body: values.body ?? '',
        url: (values.url ?? '').trim(),
        code: values.code ?? '',
        codeLanguage: values.codeLanguage ?? '',
        clientId: values.clientId || null,
        clientName,
        productId: values.productId || null,
        diagram: values.diagram ?? asset.diagram,
    }

    return (
        <FormProvider {...form}>
            <PageHeader
                eyebrow="Asset editor"
                title={values.title || asset.title}
                description={
                    <span className="flex flex-wrap items-center gap-2">
                        <AssetKindTag kind={values.kind ?? asset.kind} />
                        <PublishStatusTag status={asset.status} />
                        <span className="text-sm" aria-live="polite">
                            {isDirty ? (
                                <span className="font-semibold text-warning">Unsaved changes</span>
                            ) : (
                                `Saved ${formatDateTime(asset.updatedAt)}${asset.updatedByName ? ` by ${asset.updatedByName}` : ''}`
                            )}
                        </span>
                    </span>
                }
                actions={
                    <>
                        {asset.status === 'published' && (
                            <LinkButton size="sm" href={getAssetPath(assetId)} icon={<PreviewIcon />}>
                                View
                            </LinkButton>
                        )}
                        <Button
                            size="sm"
                            type="submit"
                            form={FORM_ID}
                            icon={<SaveIcon />}
                            loading={isSubmitting && !busy}
                            disabled={!isDirty || busy}
                        >
                            Save
                        </Button>
                        {asset.status === 'published' ? (
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
                        {asset.status === 'draft' && (
                            <Button size="sm" variant="plain" onClick={() => setPendingStatus('archived')}>
                                Archive
                            </Button>
                        )}
                        {asset.status !== 'published' && (
                            <Button
                                size="sm"
                                variant="plain"
                                icon={<DeleteIcon />}
                                aria-label="Delete asset"
                                onClick={() => setConfirmDelete(true)}
                            />
                        )}
                    </>
                }
            />

            {/* One form around every tab, so Save submits whichever tab is open */}
            <Form id={FORM_ID} onSubmit={form.handleSubmit(save)} noValidate>
                <Tabs value={activeTab} onChange={setTab}>
                    <Tabs.TabList className="mb-6">
                        <Tabs.TabNav value="write" icon={<EditIcon />}>
                            Write
                        </Tabs.TabNav>
                        {isArchitecture && (
                            <Tabs.TabNav value="diagram" icon={<DiagramIcon />}>
                                Architecture diagram
                            </Tabs.TabNav>
                        )}
                        <Tabs.TabNav value="preview" icon={<PreviewIcon />}>
                            Preview
                        </Tabs.TabNav>
                    </Tabs.TabList>
                    <Tabs.TabContent value="write">
                        <div className="grid gap-6 lg:grid-cols-3">
                            <div className="min-w-0 space-y-6 lg:col-span-2">
                                <Card>
                                    <AssetTitleFields />
                                    <MarkdownBodyEditor<AssetFormData>
                                        name="body"
                                        id={ASSET_FIELD_IDS.body}
                                        label="How to use it"
                                        hint="Prerequisites, steps, parameters and gotchas — with images, videos and tables"
                                    />
                                </Card>
                                <Card header={{ content: 'Code snippet (optional)' }}>
                                    <AssetCodeFields />
                                </Card>
                            </div>
                            <aside className="space-y-6">
                                <Card
                                    header={{
                                        content: asset.status === 'published' ? 'Checklist' : 'Publish checklist',
                                    }}
                                >
                                    <PublishChecklist
                                        issues={issues}
                                        published={asset.status === 'published'}
                                        fieldIds={ASSET_FIELD_IDS}
                                    />
                                </Card>
                                <Card header={{ content: 'Details' }}>
                                    <AssetDetailsFields data={data} />
                                </Card>
                            </aside>
                        </div>
                    </Tabs.TabContent>
                    {isArchitecture && (
                        <Tabs.TabContent value="diagram">
                            <Card>
                                <DiagramEditor />
                            </Card>
                        </Tabs.TabContent>
                    )}
                    <Tabs.TabContent value="preview">
                        <AssetReader asset={previewAsset} products={data.products} preview />
                    </Tabs.TabContent>
                </Tabs>
            </Form>

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
                {isDirty && ' Your unsaved changes are saved at the same time.'}
            </ConfirmDialog>
            <ConfirmDialog
                isOpen={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                type="danger"
                title="Delete this asset?"
                confirmText="Delete permanently"
                onConfirm={() => void remove()}
                loading={busy}
            >
                The asset, its instructions and its code are deleted. This can’t be undone. (Archiving keeps it
                instead.)
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
