'use client'

import { useId } from 'react'
import { Controller, FormProvider, useFieldArray, useForm, useFormContext, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { GroupBase } from 'react-select'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import Radio from '@/components/ui/Radio'
import Select from '@/components/ui/Select'
import Switcher from '@/components/ui/Switcher'
import { Form, FormItem } from '@/components/ui/Form'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import MarkdownBodyEditor from '@/components/shared/editor/MarkdownBodyEditor'
import { AddIcon, DeleteIcon } from '@/configs/icons.config'
import { apiCreateIntakeRule, apiUpdateIntakeRule, useSWRAssetOptions } from '@/services/intake'
import { useSWRArticles } from '@/services/knowledge'
import { useProductsStore } from '@/stores/AppStores'
import { useIntakeRulesStore } from '@/stores/IntakeStores'
import { groupBySection } from '@/utils/intakeRules'
import {
    conditionIssues,
    conditionValueOptions,
    describeConditions,
    isValuelessOperator,
    nextPosition,
    operatorsFor,
} from '@/utils/intakeRuleEditing'
import { tryGetErrorMessage } from '@/utils/errors'
import {
    RULE_KINDS,
    ruleKindLabel,
    ruleOperatorLabel,
    type IntakeRule,
    type IntakeRuleInput,
    type RuleOperator,
} from '@/@types/intake/IntakeRule'
import type { IntakeQuestion } from '@/@types/intake/IntakeQuestion'
import { IntakeRuleFormSchema, type IntakeRuleFormData } from '@/@types/intake/forms/IntakeRuleFormData'

const FORM_ID = 'intake-rule-form'

type Option = { value: string; label: string }

const KIND_OPTIONS: Option[] = RULE_KINDS.map((kind) => ({ value: kind, label: ruleKindLabel[kind] }))

interface RuleDialogProps {
    /** null = a new rule */
    rule: IntakeRule | null
    /** Every rule (for the next position) */
    rules: IntakeRule[]
    questions: IntakeQuestion[]
    onClose: () => void
}

const toFormData = (rule: IntakeRule | null, rules: IntakeRule[]): IntakeRuleFormData =>
    rule
        ? {
              title: rule.title,
              kind: rule.kind,
              productId: rule.productId ?? '',
              match: rule.match,
              conditions: rule.conditions,
              guidance: rule.guidance,
              showToCustomer: rule.showToCustomer,
              articleIds: rule.articleIds,
              assetIds: rule.assetIds,
              active: rule.active,
              position: rule.position,
          }
        : {
              title: '',
              kind: 'gotcha',
              productId: '',
              match: 'all',
              conditions: [{ questionKey: '', operator: 'equals', value: '' }],
              guidance: '',
              showToCustomer: false,
              articleIds: [],
              assetIds: [],
              active: true,
              position: nextPosition(rules),
          }

const toInput = (values: IntakeRuleFormData): IntakeRuleInput => ({
    title: values.title.trim(),
    kind: values.kind,
    productId: values.productId || null,
    match: values.match,
    conditions: values.conditions.map((c) => ({
        questionKey: c.questionKey,
        operator: c.operator,
        value: isValuelessOperator(c.operator) ? '' : c.value.trim(),
    })),
    guidance: values.guidance.trim(),
    // Gotchas stay internal
    showToCustomer: values.kind === 'best_practice' && values.showToCustomer,
    articleIds: values.articleIds,
    assetIds: values.assetIds,
    active: values.active,
    position: values.position,
})

/** One IF row: question → operator → value (a pick list for choice and yes/no questions) */
function ConditionRow({
    index,
    questions,
    onRemove,
    canRemove,
}: {
    index: number
    questions: IntakeQuestion[]
    onRemove: () => void
    canRemove: boolean
}) {
    const uid = useId()
    const {
        control,
        setValue,
        formState: { errors },
    } = useFormContext<IntakeRuleFormData>()
    const questionKey = useWatch({ control, name: `conditions.${index}.questionKey` })
    const operator = useWatch({ control, name: `conditions.${index}.operator` })
    const question = questions.find((q) => q.key === questionKey)
    const rowErrors = errors.conditions?.[index]

    const questionGroups: GroupBase<Option>[] = groupBySection(
        [...questions].sort((a, b) => a.position - b.position || a.label.localeCompare(b.label)),
    ).map((group) => ({
        label: group.section,
        options: group.questions.map((q) => ({ value: q.key, label: q.active ? q.label : `${q.label} (inactive)` })),
    }))
    const allQuestionOptions = questionGroups.flatMap((g) => g.options)

    const allowed = question ? operatorsFor(question.type) : []
    // Keep a stored operator the type doesn't usually offer, so editing never changes a rule silently
    const operators: RuleOperator[] = allowed.includes(operator) || !question ? allowed : [...allowed, operator]
    const operatorOptions = operators.map((op) => ({ value: op, label: ruleOperatorLabel[op] }))
    const valueOptions = question ? conditionValueOptions(question) : null

    return (
        <li className="rounded-xl border border-gray-200 p-3 dark:border-gray-700">
            <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {index === 0 ? 'If' : 'Condition'} {index + 1}
                </span>
                {canRemove && (
                    <Button
                        type="button"
                        size="xs"
                        variant="plain"
                        icon={<DeleteIcon />}
                        aria-label={`Remove condition ${index + 1}`}
                        onClick={onRemove}
                    />
                )}
            </div>
            <div className="grid gap-2 md:grid-cols-[2fr_1fr_1.5fr]">
                <div>
                    <label htmlFor={`${uid}-question`} className="sr-only">
                        Condition {index + 1} question
                    </label>
                    <Controller
                        name={`conditions.${index}.questionKey`}
                        control={control}
                        render={({ field }) => (
                            <Select<Option, false, GroupBase<Option>>
                                inputId={`${uid}-question`}
                                size="sm"
                                options={questionGroups}
                                value={allQuestionOptions.find((o) => o.value === field.value) ?? null}
                                onChange={(option) => {
                                    const next = questions.find((q) => q.key === option?.value)
                                    field.onChange(option?.value ?? '')
                                    if (next) {
                                        setValue(`conditions.${index}.operator`, operatorsFor(next.type)[0])
                                        setValue(`conditions.${index}.value`, '')
                                    }
                                }}
                                placeholder="Choose a question"
                                invalid={!!rowErrors?.questionKey}
                            />
                        )}
                    />
                    {rowErrors?.questionKey?.message && (
                        <p className="mt-1 text-xs text-error">{rowErrors.questionKey.message}</p>
                    )}
                </div>
                <div>
                    <label htmlFor={`${uid}-operator`} className="sr-only">
                        Condition {index + 1} comparison
                    </label>
                    <Controller
                        name={`conditions.${index}.operator`}
                        control={control}
                        render={({ field }) => (
                            <Select
                                inputId={`${uid}-operator`}
                                size="sm"
                                options={operatorOptions}
                                value={operatorOptions.find((o) => o.value === field.value) ?? null}
                                onChange={(option) => {
                                    if (!option) return
                                    field.onChange(option.value)
                                    if (isValuelessOperator(option.value)) setValue(`conditions.${index}.value`, '')
                                }}
                                isSearchable={false}
                                isDisabled={!question}
                            />
                        )}
                    />
                </div>
                <div>
                    {!isValuelessOperator(operator) && (
                        <>
                            <label htmlFor={`${uid}-value`} className="sr-only">
                                Condition {index + 1} value
                            </label>
                            <Controller
                                name={`conditions.${index}.value`}
                                control={control}
                                render={({ field }) =>
                                    valueOptions && operator !== 'contains' ? (
                                        <Select
                                            inputId={`${uid}-value`}
                                            size="sm"
                                            options={valueOptions}
                                            value={valueOptions.find((o) => o.value === field.value) ?? null}
                                            onChange={(option) => field.onChange(option?.value ?? '')}
                                            placeholder="Choose a value"
                                            invalid={!!rowErrors?.value}
                                        />
                                    ) : (
                                        <Input
                                            id={`${uid}-value`}
                                            size="sm"
                                            type={question?.type === 'number' ? 'number' : 'text'}
                                            maxLength={200}
                                            placeholder={question?.type === 'number' ? 'A number' : 'Text'}
                                            invalid={!!rowErrors?.value}
                                            disabled={!question}
                                            {...field}
                                        />
                                    )
                                }
                            />
                            {rowErrors?.value?.message && (
                                <p className="mt-1 text-xs text-error">{rowErrors.value.message}</p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </li>
    )
}

/** Create or edit an IF/ELSE rule */
export default function RuleDialog({ rule, rules, questions, onClose }: RuleDialogProps) {
    const uid = useId()
    const id = (name: string) => `${uid}-${name}`
    const refresh = useIntakeRulesStore((s) => s.refresh)
    const products = useProductsStore((s) => s.data)
    const articles = useSWRArticles({})
    const assets = useSWRAssetOptions(true)

    const form = useForm<IntakeRuleFormData>({
        resolver: zodResolver(IntakeRuleFormSchema),
        defaultValues: toFormData(rule, rules),
    })
    const {
        control,
        setError,
        setValue,
        formState: { errors, isSubmitting },
    } = form
    const conditions = useFieldArray({ control, name: 'conditions' })
    const kind = useWatch({ control, name: 'kind' })
    const match = useWatch({ control, name: 'match' })
    const watchedConditions = useWatch({ control, name: 'conditions' })

    const productOptions: Option[] = [
        { value: '', label: 'Every product' },
        ...(products ?? [])
            .filter((p) => p.active || p.id === rule?.productId)
            .map((p) => ({ value: p.id, label: p.name })),
    ]

    // Linked items: keep ids the lists don't include (e.g. archived articles) so they aren't lost
    const linkOptions = (items: { id: string; title: string }[] | undefined, selected: string[], what: string) => {
        const options = (items ?? []).map((item) => ({ value: item.id, label: item.title }))
        const missing = selected
            .filter((sid) => !options.some((o) => o.value === sid))
            .map((sid) => ({ value: sid, label: `Unlisted ${what}` }))
        return [...options, ...missing]
    }

    const summary = describeConditions(
        { match, conditions: (watchedConditions ?? []).filter((c) => c?.questionKey) },
        questions,
    )

    const onValid = async (values: IntakeRuleFormData) => {
        const issues = conditionIssues(values.conditions, questions)
        if (issues.length) {
            setError('conditions', { type: 'custom', message: issues[0] })
            return
        }
        try {
            const input = toInput(values)
            if (rule) await apiUpdateIntakeRule(rule.id, input)
            else await apiCreateIntakeRule(input)
            toastSuccess(rule ? 'Rule saved.' : 'Rule added.')
            await refresh()
            onClose()
        } catch (error) {
            toastError('The rule couldn’t be saved.', error)
        }
    }

    const conditionsError = errors.conditions?.message ?? errors.conditions?.root?.message

    return (
        <Dialog isOpen onClose={onClose} onRequestClose={isSubmitting ? undefined : onClose} width={880}>
            <h4 className="mb-4 pr-8">{rule ? 'Edit rule' : 'Add rule'}</h4>
            <FormProvider {...form}>
                <Form id={FORM_ID} onSubmit={form.handleSubmit(onValid)} noValidate>
                    <FormItem
                        label="Title"
                        htmlFor={id('title')}
                        asterisk
                        invalid={!!errors.title}
                        errorMessage={errors.title?.message}
                    >
                        <Controller
                            name="title"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    id={id('title')}
                                    maxLength={200}
                                    autoFocus
                                    placeholder="e.g. On-premises data needs a gateway"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                    <div className="grid gap-x-4 md:grid-cols-3">
                        <FormItem label="Kind" htmlFor={id('kind')}>
                            <Controller
                                name="kind"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        inputId={id('kind')}
                                        options={KIND_OPTIONS}
                                        value={KIND_OPTIONS.find((o) => o.value === field.value)}
                                        onChange={(option) => {
                                            if (!option) return
                                            field.onChange(option.value)
                                            if (option.value === 'gotcha') setValue('showToCustomer', false)
                                        }}
                                        isSearchable={false}
                                    />
                                )}
                            />
                        </FormItem>
                        <FormItem label="Product" htmlFor={id('product')}>
                            <Controller
                                name="productId"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        inputId={id('product')}
                                        options={productOptions}
                                        isLoading={!products}
                                        value={productOptions.find((o) => o.value === field.value) ?? productOptions[0]}
                                        onChange={(option) => field.onChange(option?.value ?? '')}
                                        isSearchable={false}
                                    />
                                )}
                            />
                        </FormItem>
                        <FormItem
                            label="Position"
                            htmlFor={id('position')}
                            invalid={!!errors.position}
                            errorMessage={errors.position?.message}
                        >
                            <Controller
                                name="position"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        id={id('position')}
                                        type="number"
                                        min={0}
                                        max={100000}
                                        step={10}
                                        value={Number.isFinite(field.value) ? field.value : ''}
                                        onChange={(e) =>
                                            field.onChange(e.target.value === '' ? Number.NaN : Number(e.target.value))
                                        }
                                        onBlur={field.onBlur}
                                    />
                                )}
                            />
                        </FormItem>
                    </div>
                    <p className="-mt-3 mb-4 text-xs text-gray-500">
                        A product rule only applies when that product is in the intake’s scope. Lower positions are
                        listed first.
                    </p>

                    <fieldset className="mb-6 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                        <legend className="px-1 text-sm font-semibold">Conditions</legend>
                        <Controller
                            name="match"
                            control={control}
                            render={({ field }) => (
                                <Radio.Group
                                    name={id('match')}
                                    value={field.value}
                                    onChange={(value: 'all' | 'any') => field.onChange(value)}
                                    className="mb-3 flex-wrap"
                                >
                                    <Radio value="all">All must match (AND)</Radio>
                                    <Radio value="any">Any can match (OR)</Radio>
                                </Radio.Group>
                            )}
                        />
                        {conditionsError && (
                            <Alert showIcon type="danger" className="mb-3">
                                {conditionsError}
                            </Alert>
                        )}
                        <ol className="space-y-2">
                            {conditions.fields.map((row, index) => (
                                <ConditionRow
                                    key={row.id}
                                    index={index}
                                    questions={questions}
                                    canRemove={conditions.fields.length > 1}
                                    onRemove={() => conditions.remove(index)}
                                />
                            ))}
                        </ol>
                        <Button
                            type="button"
                            size="sm"
                            className="mt-3"
                            icon={<AddIcon />}
                            disabled={conditions.fields.length >= 20}
                            onClick={() => conditions.append({ questionKey: '', operator: 'equals', value: '' })}
                        >
                            Add condition
                        </Button>
                        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300" aria-live="polite">
                            {summary} <span className="font-semibold">THEN</span> show this{' '}
                            {kind === 'gotcha' ? 'gotcha' : 'best practice'}.
                        </p>
                    </fieldset>

                    <MarkdownBodyEditor<IntakeRuleFormData>
                        name="guidance"
                        id={id('guidance')}
                        label="Guidance"
                        hint="What to do about it. Shown on the intake and carried into the BRDs."
                        placeholder="Explain the risk or the recommended approach…"
                        initialMode="write"
                    />

                    <div className="mb-6 flex items-start gap-3">
                        <Controller
                            name="showToCustomer"
                            control={control}
                            render={({ field }) => (
                                <Switcher
                                    id={id('customer')}
                                    checked={kind === 'best_practice' && field.value}
                                    disabled={kind !== 'best_practice'}
                                    onChange={(checked) => field.onChange(checked)}
                                />
                            )}
                        />
                        <div>
                            <label htmlFor={id('customer')} className="text-sm font-semibold">
                                Include in the customer BRD
                            </label>
                            <p className="text-xs text-gray-500">
                                {kind === 'best_practice'
                                    ? 'Best practices can appear in the customer-facing BRD. Leave off to keep this in the internal delivery brief only.'
                                    : 'Gotchas always stay internal: they appear in the internal delivery brief, never in the customer BRD.'}
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-x-4 md:grid-cols-2">
                        <FormItem
                            label="Linked articles"
                            htmlFor={id('articles')}
                            invalid={!!errors.articleIds}
                            errorMessage={errors.articleIds?.message}
                        >
                            <Controller
                                name="articleIds"
                                control={control}
                                render={({ field }) => {
                                    const options = linkOptions(articles.data, field.value, 'article')
                                    return (
                                        <Select<Option, true>
                                            inputId={id('articles')}
                                            isMulti
                                            options={options}
                                            isLoading={articles.isLoading}
                                            value={options.filter((o) => field.value.includes(o.value))}
                                            onChange={(selected) => field.onChange(selected.map((o) => o.value))}
                                            placeholder="No articles"
                                            noOptionsMessage={() =>
                                                articles.error
                                                    ? `Couldn’t load articles: ${tryGetErrorMessage(articles.error)}`
                                                    : 'No articles found'
                                            }
                                        />
                                    )
                                }}
                            />
                        </FormItem>
                        <FormItem
                            label="Linked library assets"
                            htmlFor={id('assets')}
                            invalid={!!errors.assetIds}
                            errorMessage={errors.assetIds?.message}
                        >
                            <Controller
                                name="assetIds"
                                control={control}
                                render={({ field }) => {
                                    const options = linkOptions(assets.data, field.value, 'asset')
                                    return (
                                        <Select<Option, true>
                                            inputId={id('assets')}
                                            isMulti
                                            options={options}
                                            isLoading={assets.isLoading}
                                            value={options.filter((o) => field.value.includes(o.value))}
                                            onChange={(selected) => field.onChange(selected.map((o) => o.value))}
                                            placeholder={assets.error ? 'The library isn’t available' : 'No assets'}
                                            noOptionsMessage={() =>
                                                assets.error
                                                    ? 'The library couldn’t be loaded. You can link assets later.'
                                                    : 'No assets found'
                                            }
                                        />
                                    )
                                }}
                            />
                        </FormItem>
                    </div>
                    <p className="-mt-3 mb-4 text-xs text-gray-500">
                        Links appear with the guidance on the intake and in the BRDs.
                    </p>

                    <Controller
                        name="active"
                        control={control}
                        render={({ field }) => (
                            <div className="flex items-center gap-3">
                                <Switcher
                                    id={id('active')}
                                    checked={field.value}
                                    onChange={(checked) => field.onChange(checked)}
                                />
                                <label htmlFor={id('active')} className="text-sm font-semibold">
                                    Active (evaluated on intakes)
                                </label>
                            </div>
                        )}
                    />
                </Form>
            </FormProvider>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button onClick={onClose} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button variant="solid" type="submit" form={FORM_ID} loading={isSubmitting}>
                    {rule ? 'Save rule' : 'Add rule'}
                </Button>
            </div>
        </Dialog>
    )
}
