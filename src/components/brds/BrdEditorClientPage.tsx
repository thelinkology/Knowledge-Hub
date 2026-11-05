'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import LinkButton from '@/components/ui/LinkButton'
import Segment from '@/components/ui/Segment'
import Tabs from '@/components/ui/Tabs'
import { Form, FormItem } from '@/components/ui/Form'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import ErrorState from '@/components/shared/ErrorState'
import Loading from '@/components/shared/Loading'
import PageHeader from '@/components/shared/PageHeader'
import MilestonesEditor from '@/components/shared/MilestonesEditor'
import MarkdownBodyEditor from '@/components/shared/editor/MarkdownBodyEditor'
import BrdDocument, { BrdAudienceBanner } from './BrdDocument'
import { BrdAudienceTag, BrdStatusTag } from './BrdTags'
import { DeleteIcon, EditIcon, GenerateIcon, PreviewIcon, SaveIcon } from '@/configs/icons.config'
import { brdsPath, getBrdEditPath, getBrdPath, getClientPath, getIntakePath } from '@/configs/app.config'
import { apiDeleteBrd, apiGenerateBrds, apiGetBrd, apiSaveBrd } from '@/services/brds'
import { useBrdStore } from '@/stores/BrdStores'
import { tryGetErrorMessage } from '@/utils/errors'
import { usePageBreadcrumbs } from '@/utils/hooks/useBreadcrumbs'
import useUnsavedChangesGuard from '@/utils/hooks/useUnsavedChangesGuard'
import { formatDateTime } from '@/utils/dates'
import {
    BRD_STATUSES,
    SaveBrdSchema,
    brdAudienceLabel,
    brdStatusLabel,
    type Brd,
    type BrdStatus,
    type SaveBrdInput,
} from '@/@types/brds/Brd'

const FORM_ID = 'brd-editor-form'
const FIELD_IDS = { title: 'brd-title', body: 'brd-body' } as const

const STATUS_HELP: Record<BrdStatus, string> = {
    draft: 'Work in progress. Regenerating from the intake replaces a draft.',
    final: 'Agreed and ready to share. Regenerating never overwrites a final BRD.',
}

const toFormData = (brd: Brd): SaveBrdInput => ({
    title: brd.title,
    status: brd.status,
    body: brd.body,
    milestones: brd.milestones,
})

interface BrdEditorClientPageProps {
    brdId: string
}

/** The BRD editor: title, status, the document text and the delivery plan */
export default function BrdEditorClientPage({ brdId }: BrdEditorClientPageProps) {
    const brd = useBrdStore(brdId, (s) => s.data)
    const error = useBrdStore(brdId, (s) => s.error)
    const refresh = useBrdStore(brdId, (s) => s.refresh)

    if (!brd)
        return error ? (
            <ErrorState message={error} onRetry={() => void refresh()} />
        ) : (
            <Loading loading message="Opening the editor…" />
        )
    // The form is created once from the loaded BRD and reset only after our own saves
    return <BrdEditor key={brdId} brd={brd} />
}

function BrdEditor({ brd }: { brd: Brd }) {
    const router = useRouter()
    const brdId = brd.id
    const setData = useBrdStore(brdId, (s) => s.setData)
    const [tab, setTab] = useState('write')
    const [busy, setBusy] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [confirmRegenerate, setConfirmRegenerate] = useState(false)

    const form = useForm<SaveBrdInput>({
        resolver: zodResolver(SaveBrdSchema),
        defaultValues: toFormData(brd),
        mode: 'onBlur',
    })
    const {
        control,
        formState: { errors, isDirty, isSubmitting },
    } = form
    const values = useWatch({ control }) as SaveBrdInput

    usePageBreadcrumbs([
        { label: 'BRDs', href: brdsPath },
        { label: brd.clientName, href: getClientPath(brd.clientId, 'brds') },
        { label: brd.title, href: getBrdPath(brdId) },
        { label: 'Edit' },
    ])

    const applySaved = useCallback(
        (saved: Brd) => {
            setData(saved)
            form.reset(toFormData(saved))
        },
        [setData, form],
    )

    const save = useCallback(
        async (formValues: SaveBrdInput) => {
            try {
                const saved = await apiSaveBrd(brdId, formValues)
                const finalised = brd.status !== 'final' && saved.status === 'final'
                applySaved(saved)
                toastSuccess(finalised ? 'Saved and marked final.' : 'Saved.', { duration: 3000 })
                return true
            } catch (e) {
                toastError(`Couldn’t save. ${tryGetErrorMessage(e)}`, e)
                return false
            }
        },
        [brdId, brd.status, applySaved],
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

    const remove = async () => {
        setBusy(true)
        try {
            await apiDeleteBrd(brdId)
            form.reset(form.getValues()) // nothing to guard any more
            toastSuccess('BRD deleted.')
            router.push(brd.intakeId ? getIntakePath(brd.intakeId) : brdsPath)
        } catch (e) {
            toastError(`Couldn’t delete the BRD. ${tryGetErrorMessage(e)}`, e)
            setBusy(false)
        }
    }

    const regenerate = async () => {
        if (!brd.intakeId) return
        setBusy(true)
        try {
            const generated = await apiGenerateBrds(brd.intakeId, { audiences: [brd.audience] })
            const mine = generated.find((g) => g.id === brdId)
            if (mine) {
                applySaved(await apiGetBrd(brdId))
                toastSuccess('Regenerated from the intake’s current answers.')
            } else if (generated[0]) {
                // The intake's latest draft was another BRD: that one was regenerated — open it
                form.reset(form.getValues())
                toastSuccess('Regenerated the intake’s latest draft — opening it.')
                router.push(getBrdEditPath(generated[0].id))
            }
            setConfirmRegenerate(false)
        } catch (e) {
            toastError(`Couldn’t regenerate the BRD. ${tryGetErrorMessage(e)}`, e)
        } finally {
            setBusy(false)
        }
    }

    // What the preview shows: the form's current values on top of the stored BRD
    const preview = {
        ...brd,
        title: values.title ?? brd.title,
        status: values.status ?? brd.status,
        body: values.body ?? '',
        milestones: values.milestones ?? [],
    }
    const canRegenerate = !!brd.intakeId && brd.status === 'draft'

    return (
        <FormProvider {...form}>
            <PageHeader
                eyebrow={`${brdAudienceLabel[brd.audience]} · editor`}
                title={values.title || brd.title}
                description={
                    <span className="flex flex-wrap items-center gap-2">
                        <BrdAudienceTag audience={brd.audience} />
                        <BrdStatusTag status={brd.status} />
                        <span className="text-sm" aria-live="polite">
                            {isDirty ? (
                                <span className="font-semibold text-warning">Unsaved changes</span>
                            ) : (
                                `Saved ${formatDateTime(brd.updatedAt)}${brd.updatedByName ? ` by ${brd.updatedByName}` : ''}`
                            )}
                        </span>
                    </span>
                }
                actions={
                    <>
                        <LinkButton size="sm" href={getBrdPath(brdId)} icon={<PreviewIcon />}>
                            View
                        </LinkButton>
                        {canRegenerate && (
                            <Button
                                size="sm"
                                icon={<GenerateIcon />}
                                onClick={() => setConfirmRegenerate(true)}
                                disabled={busy}
                            >
                                Regenerate from intake
                            </Button>
                        )}
                        <Button
                            size="sm"
                            variant="solid"
                            type="submit"
                            form={FORM_ID}
                            icon={<SaveIcon />}
                            loading={isSubmitting}
                            disabled={!isDirty || busy}
                        >
                            Save
                        </Button>
                        <Button
                            size="sm"
                            variant="plain"
                            icon={<DeleteIcon />}
                            aria-label="Delete BRD"
                            onClick={() => setConfirmDelete(true)}
                            disabled={busy}
                        />
                    </>
                }
            />

            <BrdAudienceBanner audience={brd.audience} clientName={brd.clientName} className="mb-6" />

            <Tabs value={tab} onChange={setTab}>
                <Tabs.TabList className="mb-6">
                    <Tabs.TabNav value="write" icon={<EditIcon />}>
                        Write
                    </Tabs.TabNav>
                    <Tabs.TabNav value="preview" icon={<PreviewIcon />}>
                        Document preview
                    </Tabs.TabNav>
                </Tabs.TabList>
                <Tabs.TabContent value="write">
                    <Form id={FORM_ID} onSubmit={form.handleSubmit(save)} noValidate>
                        <div className="grid gap-6 lg:grid-cols-3">
                            <div className="min-w-0 space-y-6 lg:col-span-2">
                                <Card>
                                    <FormItem
                                        label="Title"
                                        htmlFor={FIELD_IDS.title}
                                        asterisk
                                        invalid={!!errors.title}
                                        errorMessage={errors.title?.message}
                                    >
                                        <Controller
                                            name="title"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    id={FIELD_IDS.title}
                                                    maxLength={200}
                                                    invalid={!!errors.title}
                                                    {...field}
                                                />
                                            )}
                                        />
                                    </FormItem>
                                    <MarkdownBodyEditor<SaveBrdInput>
                                        name="body"
                                        id={FIELD_IDS.body}
                                        label="Document"
                                        hint="The milestones section is added from the delivery plan below"
                                    />
                                </Card>
                                <Card
                                    header={{
                                        content: (
                                            <div>
                                                <span>Delivery plan</span>
                                                <p className="mt-0.5 text-sm font-normal text-gray-500 dark:text-gray-400">
                                                    {brd.audience === 'customer'
                                                        ? 'Shown as the Milestones table, before the sign-off.'
                                                        : 'Shown as “Milestones, deliverables & dependencies”.'}
                                                </p>
                                            </div>
                                        ),
                                    }}
                                >
                                    <MilestonesEditor name="milestones" />
                                </Card>
                            </div>
                            <aside className="space-y-6">
                                <Card header={{ content: 'Status' }}>
                                    <Controller
                                        name="status"
                                        control={control}
                                        render={({ field }) => (
                                            <Segment
                                                size="sm"
                                                value={field.value}
                                                onChange={(value) => {
                                                    if (typeof value === 'string' && value) field.onChange(value)
                                                }}
                                                aria-label="Status"
                                            >
                                                {BRD_STATUSES.map((status) => (
                                                    <Segment.Item key={status} value={status} type="button">
                                                        {brdStatusLabel[status]}
                                                    </Segment.Item>
                                                ))}
                                            </Segment>
                                        )}
                                    />
                                    <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                                        {STATUS_HELP[values.status ?? brd.status]}
                                    </p>
                                    {values.status !== brd.status && (
                                        <p className="mt-2 text-sm font-semibold text-warning">
                                            Save to make it {brdStatusLabel[values.status ?? brd.status].toLowerCase()}.
                                        </p>
                                    )}
                                </Card>
                                <Card header={{ content: 'Details' }}>
                                    <dl className="space-y-3 text-sm">
                                        <div>
                                            <dt className="text-gray-500 dark:text-gray-400">Document</dt>
                                            <dd className="font-semibold">{brdAudienceLabel[brd.audience]}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-gray-500 dark:text-gray-400">Client</dt>
                                            <dd>
                                                <Link
                                                    href={getClientPath(brd.clientId, 'brds')}
                                                    className="font-semibold hover:text-primary"
                                                >
                                                    {brd.clientName}
                                                </Link>
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-gray-500 dark:text-gray-400">Generated from</dt>
                                            <dd>
                                                {brd.intakeId ? (
                                                    <Link
                                                        href={getIntakePath(brd.intakeId)}
                                                        className="font-semibold hover:text-primary"
                                                    >
                                                        {brd.intakeTitle ?? 'Discovery intake'}
                                                    </Link>
                                                ) : (
                                                    <span className="text-gray-500">
                                                        The intake was deleted, so this BRD can’t be regenerated.
                                                    </span>
                                                )}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-gray-500 dark:text-gray-400">Created</dt>
                                            <dd>
                                                {formatDateTime(brd.createdAt)}
                                                {brd.createdByName && ` by ${brd.createdByName}`}
                                            </dd>
                                        </div>
                                    </dl>
                                </Card>
                            </aside>
                        </div>
                    </Form>
                </Tabs.TabContent>
                <Tabs.TabContent value="preview">
                    <BrdDocument brd={preview} preview />
                </Tabs.TabContent>
            </Tabs>

            <ConfirmDialog
                isOpen={confirmRegenerate}
                onClose={() => setConfirmRegenerate(false)}
                type="warning"
                title="Regenerate from the intake?"
                confirmText="Regenerate"
                onConfirm={() => void regenerate()}
                loading={busy}
            >
                This draft’s title, text and delivery plan are replaced with a fresh version built from the intake’s
                current answers, rules and library.{' '}
                {isDirty ? 'Your unsaved changes and earlier edits are lost.' : 'Your edits to this draft are lost.'}{' '}
                This can’t be undone. Final BRDs are never overwritten.
            </ConfirmDialog>
            <ConfirmDialog
                isOpen={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                type="danger"
                title="Delete this BRD?"
                confirmText="Delete permanently"
                onConfirm={() => void remove()}
                loading={busy}
            >
                {brd.status === 'final'
                    ? 'This BRD is final. Deleting it removes the agreed version for good. This can’t be undone.'
                    : 'The BRD is deleted. This can’t be undone — but you can generate it again from the intake.'}
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
