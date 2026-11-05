'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Form, FormItem } from '@/components/ui/Form'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import Loading from '@/components/shared/Loading'
import PageHeader from '@/components/shared/PageHeader'
import BrdList from '@/components/brds/BrdList'
import ProductMultiSelect from '../ProductMultiSelect'
import { IntakeStatusTag } from '../IntakeList'
import IntakeQuestionField from './IntakeQuestionField'
import IntakeGuidancePanel from './IntakeGuidancePanel'
import { INTAKE_FIELD_IDS, focusQuestion, formAnswers, toFormData, toSaveInput } from './intakeForm'
import navigationIcon, { DeleteIcon, GenerateIcon, SaveIcon } from '@/configs/icons.config'
import { adminIntakePath, getClientPath, intakesPath } from '@/configs/app.config'
import { apiDeleteIntake, apiSaveIntake } from '@/services/intake'
import { apiGenerateBrds } from '@/services/brds'
import { useIntakeEditorStore } from '@/stores/IntakeStores'
import { answersInScope, evaluateRules, groupBySection, missingRequired, visibleQuestions } from '@/utils/intakeRules'
import { tryGetErrorMessage } from '@/utils/errors'
import { usePageBreadcrumbs } from '@/utils/hooks/useBreadcrumbs'
import useUnsavedChangesGuard from '@/utils/hooks/useUnsavedChangesGuard'
import useSession from '@/utils/hooks/useSession'
import { formatDateTime } from '@/utils/dates'
import { INTAKE_STATUSES, intakeStatusLabel } from '@/@types/intake/Intake'
import { IntakeFormSchema, type IntakeFormData } from '@/@types/intake/forms/IntakeFormData'
import type { IntakeEditorDetails } from '@/@types/intake/IntakeEditorExtras'

const FORM_ID = 'intake-form'
const STATUS_OPTIONS = INTAKE_STATUSES.map((status) => ({ value: status, label: intakeStatusLabel[status] }))

interface IntakeEditorClientPageProps {
    intakeId: string
}

/** The discovery intake form: questions by section, live gotchas & best practices, then BRDs */
export default function IntakeEditorClientPage({ intakeId }: IntakeEditorClientPageProps) {
    const data = useIntakeEditorStore(intakeId, (s) => s.data)
    const error = useIntakeEditorStore(intakeId, (s) => s.error)
    const refresh = useIntakeEditorStore(intakeId, (s) => s.refresh)

    if (!data)
        return error ? (
            <ErrorState message={error} onRetry={() => void refresh()} />
        ) : (
            <Loading loading message="Opening the intake…" />
        )
    // The form is created once from the loaded data and reset only after our own saves
    return <IntakeEditor key={intakeId} data={data} />
}

function IntakeEditor({ data }: { data: IntakeEditorDetails }) {
    const router = useRouter()
    const { can } = useSession()
    const { intake, questions, rules, products, links } = data
    const intakeId = intake.id
    const setData = useIntakeEditorStore(intakeId, (s) => s.setData)
    const [busy, setBusy] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [confirmGenerate, setConfirmGenerate] = useState(false)

    const form = useForm<IntakeFormData>({
        resolver: zodResolver(IntakeFormSchema),
        defaultValues: toFormData(intake, questions),
        mode: 'onBlur',
    })
    const {
        control,
        formState: { isDirty, isSubmitting, errors },
    } = form
    const watchedTitle = useWatch({ control, name: 'title' })
    const watchedProducts = useWatch({ control, name: 'productIds' })
    // The answered values only; `compute` re-renders only when they really change (deep compare)
    const answers = useWatch({ control, name: 'answers', compute: formAnswers })

    usePageBreadcrumbs([
        { label: 'Discovery intakes', href: intakesPath },
        { label: intake.clientName, href: getClientPath(intake.clientId, 'intakes') },
        { label: intake.title },
    ])

    // Live: which questions are asked for the products in scope, which rules apply, what's missing
    const productIds = useMemo(() => watchedProducts ?? [], [watchedProducts])
    const visible = useMemo(() => visibleQuestions(questions, productIds), [questions, productIds])
    const sections = useMemo(() => groupBySection(visible), [visible])
    const matched = useMemo(
        () => evaluateRules(rules, answersInScope(visible, answers), productIds),
        [rules, visible, answers, productIds],
    )
    const missing = useMemo(() => missingRequired(visible, answers), [visible, answers])
    const missingSummary =
        missing
            .slice(0, 3)
            .map((q) => `“${q.label}”`)
            .join(', ') + (missing.length > 3 ? ', …' : '')

    const applySaved = useCallback(
        (saved: IntakeEditorDetails) => {
            setData(saved)
            form.reset(toFormData(saved.intake, saved.questions))
        },
        [setData, form],
    )

    const save = useCallback(
        async (values: IntakeFormData) => {
            try {
                applySaved(await apiSaveIntake(intakeId, toSaveInput(values)))
                toastSuccess('Saved.', { duration: 3000 })
                return true
            } catch (e) {
                toastError(`Couldn’t save. ${tryGetErrorMessage(e)}`)
                return false
            }
        },
        [intakeId, applySaved],
    )

    /** Validates and saves; resolves false (with the fields highlighted) when the form is invalid */
    const saveNow = useCallback(
        () =>
            new Promise<boolean>((resolve) => {
                void form.handleSubmit(
                    async (values) => resolve(await save(values)),
                    () => {
                        toastError('Some fields need attention. They’re highlighted in the form.')
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

    const generate = async () => {
        setGenerating(true)
        try {
            // The BRDs are built from the stored answers, so save first
            if (form.formState.isDirty && !(await saveNow())) return
            const brds = await apiGenerateBrds(intakeId, { audiences: ['customer', 'internal'] })
            toastSuccess(
                brds.length === 1
                    ? 'BRD generated. Review it below before sharing.'
                    : `${brds.length} BRDs generated: the customer BRD and the internal delivery brief. Review them below before sharing.`,
            )
            // apiGenerateBrds revalidates the BRD lists, so the list below refreshes itself
            setConfirmGenerate(false)
        } catch (e) {
            toastError('The BRDs couldn’t be generated.', e)
        } finally {
            setGenerating(false)
        }
    }

    const requestGenerate = () => {
        if (missing.length) setConfirmGenerate(true)
        else void generate()
    }

    const remove = async () => {
        setBusy(true)
        try {
            await apiDeleteIntake(intakeId)
            form.reset(form.getValues()) // nothing to guard any more
            toastSuccess('Intake deleted.')
            router.push(intakesPath)
        } catch (e) {
            toastError('Couldn’t delete the intake.', e)
            setBusy(false)
        }
    }

    return (
        <FormProvider {...form}>
            <PageHeader
                eyebrow="Discovery intake"
                title={watchedTitle || intake.title}
                description={
                    <span className="flex flex-wrap items-center gap-2">
                        <Link
                            href={getClientPath(intake.clientId, 'intakes')}
                            className="font-semibold text-gray-700 hover:text-primary hover:underline dark:text-gray-200"
                        >
                            {intake.clientName}
                        </Link>
                        <IntakeStatusTag status={intake.status} />
                        <span className="text-sm" aria-live="polite">
                            {isDirty ? (
                                <span className="font-semibold text-warning">Unsaved changes</span>
                            ) : (
                                `Saved ${formatDateTime(intake.updatedAt)}`
                            )}
                        </span>
                    </span>
                }
                actions={
                    <>
                        <Button
                            size="sm"
                            type="submit"
                            form={FORM_ID}
                            icon={<SaveIcon />}
                            loading={isSubmitting && !generating}
                            disabled={!isDirty}
                        >
                            Save
                        </Button>
                        <Button
                            size="sm"
                            variant="solid"
                            icon={<GenerateIcon />}
                            loading={generating}
                            disabled={busy}
                            onClick={requestGenerate}
                        >
                            Generate BRDs
                        </Button>
                        <Button
                            size="sm"
                            variant="plain"
                            icon={<DeleteIcon />}
                            aria-label="Delete intake"
                            onClick={() => setConfirmDelete(true)}
                        />
                    </>
                }
            />

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="min-w-0 space-y-6 lg:col-span-2">
                    <Form id={FORM_ID} onSubmit={form.handleSubmit(save)} noValidate>
                        <div className="space-y-6">
                            <Card header={{ content: 'Intake details' }}>
                                <FormItem
                                    label="Title"
                                    htmlFor={INTAKE_FIELD_IDS.title}
                                    asterisk
                                    invalid={!!errors.title}
                                    errorMessage={errors.title?.message}
                                >
                                    <Controller
                                        name="title"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                id={INTAKE_FIELD_IDS.title}
                                                maxLength={200}
                                                invalid={!!errors.title}
                                                {...field}
                                            />
                                        )}
                                    />
                                </FormItem>
                                <div className="grid gap-x-4 md:grid-cols-3">
                                    <FormItem label="Status" htmlFor={INTAKE_FIELD_IDS.status}>
                                        <Controller
                                            name="status"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    inputId={INTAKE_FIELD_IDS.status}
                                                    options={STATUS_OPTIONS}
                                                    value={STATUS_OPTIONS.find((o) => o.value === field.value)}
                                                    onChange={(option) => option && field.onChange(option.value)}
                                                    isSearchable={false}
                                                />
                                            )}
                                        />
                                    </FormItem>
                                    <FormItem
                                        label="Products in scope"
                                        htmlFor={INTAKE_FIELD_IDS.products}
                                        className="md:col-span-2"
                                        invalid={!!errors.productIds}
                                        errorMessage={errors.productIds?.message}
                                    >
                                        <Controller
                                            name="productIds"
                                            control={control}
                                            render={({ field }) => (
                                                <ProductMultiSelect
                                                    inputId={INTAKE_FIELD_IDS.products}
                                                    products={products}
                                                    value={field.value ?? []}
                                                    onChange={field.onChange}
                                                    aria-describedby="intake-products-help"
                                                />
                                            )}
                                        />
                                    </FormItem>
                                </div>
                                <p id="intake-products-help" className="-mt-3 text-xs text-gray-500">
                                    Product-specific questions and rules appear for the products in scope. Answers to
                                    questions you hide are kept.
                                </p>
                            </Card>

                            {sections.length === 0 ? (
                                <Card>
                                    <EmptyState
                                        icon={navigationIcon.intake}
                                        title="No questions to ask yet"
                                        description="There are no active discovery questions for these products. Administrators configure them under Intake & rules."
                                        action={
                                            can('settings.manage') ? (
                                                <Link
                                                    href={adminIntakePath}
                                                    className="text-sm text-primary hover:underline"
                                                >
                                                    Configure questions
                                                </Link>
                                            ) : undefined
                                        }
                                    />
                                </Card>
                            ) : (
                                sections.map((group) => (
                                    <Card key={group.section} header={{ content: group.section }}>
                                        {group.questions.map((question) => (
                                            <IntakeQuestionField
                                                key={question.id}
                                                question={question}
                                                products={products}
                                            />
                                        ))}
                                    </Card>
                                ))
                            )}

                            <Card header={{ content: 'Notes' }}>
                                <FormItem
                                    label="Discovery notes"
                                    htmlFor="intake-notes"
                                    invalid={!!errors.notes}
                                    errorMessage={errors.notes?.message}
                                    className="mb-0"
                                >
                                    <Controller
                                        name="notes"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                id="intake-notes"
                                                textArea
                                                rows={5}
                                                maxLength={20000}
                                                placeholder="Anything else from the sessions: open questions, decisions, follow-ups…"
                                                {...field}
                                            />
                                        )}
                                    />
                                </FormItem>
                            </Card>
                        </div>
                    </Form>

                    <section aria-labelledby="intake-brds-heading">
                        <Card
                            header={{
                                content: <span id="intake-brds-heading">BRDs from this intake</span>,
                                extra: (
                                    <Button
                                        size="sm"
                                        icon={<GenerateIcon />}
                                        loading={generating}
                                        disabled={busy}
                                        onClick={requestGenerate}
                                    >
                                        Generate BRDs
                                    </Button>
                                ),
                            }}
                        >
                            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                                Generating creates a customer-facing BRD and an internal delivery brief from the saved
                                answers and the rules that apply. Gotchas stay in the internal brief.
                            </p>
                            <BrdList intakeId={intakeId} />
                        </Card>
                    </section>
                </div>

                <IntakeGuidancePanel
                    className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto"
                    matched={matched}
                    links={links}
                    products={products}
                    missing={missing}
                    onFocusQuestion={focusQuestion}
                />
            </div>

            <ConfirmDialog
                isOpen={confirmGenerate}
                onClose={() => setConfirmGenerate(false)}
                type="warning"
                title="Generate with missing answers?"
                confirmText="Generate anyway"
                cancelText="Keep answering"
                onConfirm={() => void generate()}
                loading={generating}
            >
                {`${missing.length} required question${missing.length === 1 ? ' has' : 's have'} no answer yet (${missingSummary}). `}
                The BRDs will have gaps there; you can generate them again after answering.
            </ConfirmDialog>
            <ConfirmDialog
                isOpen={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                type="danger"
                title="Delete this intake?"
                confirmText="Delete permanently"
                onConfirm={() => void remove()}
                loading={busy}
            >
                The intake and all of its answers are deleted. BRDs already generated from it are kept. This can’t be
                undone.
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
