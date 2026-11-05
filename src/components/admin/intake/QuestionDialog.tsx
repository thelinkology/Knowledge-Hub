'use client'

import { useId, useRef } from 'react'
import { Controller, FormProvider, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Switcher from '@/components/ui/Switcher'
import { Form, FormItem } from '@/components/ui/Form'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import { AddIcon, DeleteIcon } from '@/configs/icons.config'
import { apiCreateIntakeQuestion, apiUpdateIntakeQuestion } from '@/services/intake'
import { useProductsStore } from '@/stores/AppStores'
import { useIntakeQuestionsStore } from '@/stores/IntakeStores'
import { nextPosition, toQuestionKey } from '@/utils/intakeRuleEditing'
import {
    QUESTION_TYPES,
    isChoiceType,
    questionTypeLabel,
    type IntakeQuestion,
    type IntakeQuestionInput,
} from '@/@types/intake/IntakeQuestion'
import { IntakeQuestionFormSchema, type IntakeQuestionFormData } from '@/@types/intake/forms/IntakeQuestionFormData'

const FORM_ID = 'intake-question-form'
const TYPE_OPTIONS = QUESTION_TYPES.map((type) => ({ value: type, label: questionTypeLabel[type] }))

interface QuestionDialogProps {
    /** null = a new question */
    question: IntakeQuestion | null
    /** Every question (for section suggestions and the next position) */
    questions: IntakeQuestion[]
    /** How many rules ask about this question (its key can't change while they do) */
    usedByRules: number
    onClose: () => void
}

const toFormData = (question: IntakeQuestion | null, questions: IntakeQuestion[]): IntakeQuestionFormData =>
    question
        ? {
              key: question.key,
              section: question.section,
              label: question.label,
              help: question.help,
              type: question.type,
              options: question.options,
              required: question.required,
              productId: question.productId ?? '',
              position: question.position,
              active: question.active,
          }
        : {
              key: '',
              section: questions.at(-1)?.section ?? '',
              label: '',
              help: '',
              type: 'text',
              options: [],
              required: false,
              productId: '',
              position: nextPosition(questions),
              active: true,
          }

const toInput = (values: IntakeQuestionFormData): IntakeQuestionInput => ({
    key: values.key.trim(),
    section: values.section.trim(),
    label: values.label.trim(),
    help: values.help.trim(),
    type: values.type,
    options: isChoiceType(values.type)
        ? values.options.map((o) => ({ value: o.value.trim(), label: o.label.trim() }))
        : [],
    required: values.required,
    productId: values.productId || null,
    position: values.position,
    active: values.active,
})

/** Create or edit a discovery question */
export default function QuestionDialog({ question, questions, usedByRules, onClose }: QuestionDialogProps) {
    const uid = useId()
    const refresh = useIntakeQuestionsStore((s) => s.refresh)
    const products = useProductsStore((s) => s.data)
    const form = useForm<IntakeQuestionFormData>({
        resolver: zodResolver(IntakeQuestionFormSchema),
        defaultValues: toFormData(question, questions),
    })
    const {
        control,
        setValue,
        getFieldState,
        formState: { errors, isSubmitting },
    } = form
    const options = useFieldArray({ control, name: 'options' })
    const type = useWatch({ control, name: 'type' })
    // A new question's key follows its wording until someone edits the key
    const keyTouched = useRef(!!question)

    const sections = [...new Set(questions.map((q) => q.section))]
    const productOptions = [
        { value: '', label: 'Every product' },
        ...(products ?? [])
            .filter((p) => p.active || p.id === question?.productId)
            .map((p) => ({ value: p.id, label: p.name })),
    ]

    const onValid = async (values: IntakeQuestionFormData) => {
        try {
            const input = toInput(values)
            if (question) await apiUpdateIntakeQuestion(question.id, input)
            else await apiCreateIntakeQuestion(input)
            toastSuccess(question ? 'Question saved.' : 'Question added.')
            await refresh()
            onClose()
        } catch (error) {
            toastError('The question couldn’t be saved.', error)
        }
    }

    const id = (name: string) => `${uid}-${name}`

    return (
        <Dialog isOpen onClose={onClose} onRequestClose={isSubmitting ? undefined : onClose} width={760}>
            <h4 className="mb-4 pr-8">{question ? 'Edit question' : 'Add question'}</h4>
            <FormProvider {...form}>
                <Form id={FORM_ID} onSubmit={form.handleSubmit(onValid)} noValidate>
                    <FormItem
                        label="Question"
                        htmlFor={id('label')}
                        asterisk
                        invalid={!!errors.label}
                        errorMessage={errors.label?.message}
                    >
                        <Controller
                            name="label"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    id={id('label')}
                                    maxLength={300}
                                    autoFocus
                                    placeholder="e.g. Is any source data on-premises?"
                                    {...field}
                                    onChange={(e) => {
                                        field.onChange(e)
                                        if (!keyTouched.current) {
                                            setValue('key', toQuestionKey(e.target.value), {
                                                shouldValidate: getFieldState('key').invalid,
                                            })
                                        }
                                    }}
                                />
                            )}
                        />
                    </FormItem>
                    <div className="grid gap-x-4 md:grid-cols-2">
                        <FormItem
                            label="Key"
                            htmlFor={id('key')}
                            asterisk
                            invalid={!!errors.key}
                            errorMessage={errors.key?.message}
                        >
                            <Controller
                                name="key"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        id={id('key')}
                                        maxLength={60}
                                        autoComplete="off"
                                        spellCheck={false}
                                        className="font-mono"
                                        aria-describedby={id('key-help')}
                                        disabled={!!question && usedByRules > 0}
                                        {...field}
                                        onChange={(e) => {
                                            keyTouched.current = true
                                            field.onChange(e)
                                        }}
                                    />
                                )}
                            />
                        </FormItem>
                        <FormItem
                            label="Section"
                            htmlFor={id('section')}
                            asterisk
                            invalid={!!errors.section}
                            errorMessage={errors.section?.message}
                        >
                            <Controller
                                name="section"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        id={id('section')}
                                        maxLength={80}
                                        list={id('sections')}
                                        autoComplete="off"
                                        placeholder="e.g. Data"
                                        {...field}
                                    />
                                )}
                            />
                            <datalist id={id('sections')}>
                                {sections.map((section) => (
                                    <option key={section} value={section} />
                                ))}
                            </datalist>
                        </FormItem>
                    </div>
                    <p id={id('key-help')} className="-mt-3 mb-4 text-xs text-gray-500">
                        {question && usedByRules > 0
                            ? `The key can’t change while ${usedByRules} rule${usedByRules === 1 ? ' uses' : 's use'} it.`
                            : 'Answers and rules refer to the key. Once intakes have answers, keep it and change the wording instead.'}
                    </p>
                    <FormItem
                        label="Help text"
                        htmlFor={id('help')}
                        invalid={!!errors.help}
                        errorMessage={errors.help?.message}
                    >
                        <Controller
                            name="help"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    id={id('help')}
                                    textArea
                                    rows={2}
                                    maxLength={1000}
                                    placeholder="Shown under the question: why it matters, examples"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                    <div className="grid gap-x-4 md:grid-cols-3">
                        <FormItem label="Answer type" htmlFor={id('type')}>
                            <Controller
                                name="type"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        inputId={id('type')}
                                        options={TYPE_OPTIONS}
                                        value={TYPE_OPTIONS.find((o) => o.value === field.value)}
                                        onChange={(option) => {
                                            if (!option) return
                                            field.onChange(option.value)
                                            if (isChoiceType(option.value) && !form.getValues('options').length) {
                                                options.replace([
                                                    { value: '', label: '' },
                                                    { value: '', label: '' },
                                                ])
                                            }
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
                        Product questions are only asked when that product is in scope. Lower positions come first;
                        sections appear in the order of their first question.
                    </p>

                    {isChoiceType(type) && (
                        <fieldset className="mb-6 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                            <legend className="px-1 text-sm font-semibold">Options</legend>
                            <p className="mb-3 text-xs text-gray-500">
                                The value is stored and used by rules (lower-case letters, digits and _); the label is
                                what people see.
                            </p>
                            {errors.options?.message && (
                                <Alert showIcon type="danger" className="mb-3">
                                    {errors.options.message}
                                </Alert>
                            )}
                            {errors.options?.root?.message && (
                                <Alert showIcon type="danger" className="mb-3">
                                    {errors.options.root.message}
                                </Alert>
                            )}
                            <ol className="space-y-2">
                                {options.fields.map((row, index) => {
                                    const rowErrors = errors.options?.[index]
                                    return (
                                        <li key={row.id} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
                                            <div>
                                                <label htmlFor={id(`opt-value-${index}`)} className="sr-only">
                                                    Option {index + 1} value
                                                </label>
                                                <Controller
                                                    name={`options.${index}.value`}
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Input
                                                            id={id(`opt-value-${index}`)}
                                                            size="sm"
                                                            placeholder="value"
                                                            className="font-mono"
                                                            maxLength={40}
                                                            autoComplete="off"
                                                            spellCheck={false}
                                                            invalid={!!rowErrors?.value}
                                                            {...field}
                                                        />
                                                    )}
                                                />
                                                {rowErrors?.value?.message && (
                                                    <p className="mt-1 text-xs text-error">{rowErrors.value.message}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label htmlFor={id(`opt-label-${index}`)} className="sr-only">
                                                    Option {index + 1} label
                                                </label>
                                                <Controller
                                                    name={`options.${index}.label`}
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Input
                                                            id={id(`opt-label-${index}`)}
                                                            size="sm"
                                                            placeholder="Label people see"
                                                            maxLength={150}
                                                            invalid={!!rowErrors?.label}
                                                            {...field}
                                                            onChange={(e) => {
                                                                // The value follows the label until it's edited
                                                                const valueField = `options.${index}.value` as const
                                                                const current = form.getValues(valueField)
                                                                const suggested = toQuestionKey(field.value).slice(
                                                                    0,
                                                                    40,
                                                                )
                                                                field.onChange(e)
                                                                if (!current || current === suggested) {
                                                                    setValue(
                                                                        valueField,
                                                                        toQuestionKey(e.target.value).slice(0, 40),
                                                                    )
                                                                }
                                                            }}
                                                        />
                                                    )}
                                                />
                                                {rowErrors?.label?.message && (
                                                    <p className="mt-1 text-xs text-error">{rowErrors.label.message}</p>
                                                )}
                                            </div>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="plain"
                                                icon={<DeleteIcon />}
                                                aria-label={`Remove option ${index + 1}`}
                                                onClick={() => options.remove(index)}
                                            />
                                        </li>
                                    )
                                })}
                            </ol>
                            <Button
                                type="button"
                                size="sm"
                                className="mt-3"
                                icon={<AddIcon />}
                                disabled={options.fields.length >= 30}
                                onClick={() => options.append({ value: '', label: '' })}
                            >
                                Add option
                            </Button>
                        </fieldset>
                    )}

                    <div className="flex flex-col gap-4 sm:flex-row sm:gap-10">
                        <Controller
                            name="required"
                            control={control}
                            render={({ field }) => (
                                <div className="flex items-center gap-3">
                                    <Switcher
                                        id={id('required')}
                                        checked={field.value}
                                        onChange={(checked) => field.onChange(checked)}
                                    />
                                    <label htmlFor={id('required')} className="text-sm font-semibold">
                                        Required
                                    </label>
                                </div>
                            )}
                        />
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
                                        Active (asked in intakes)
                                    </label>
                                </div>
                            )}
                        />
                    </div>
                </Form>
            </FormProvider>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button onClick={onClose} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button variant="solid" type="submit" form={FORM_ID} loading={isSubmitting}>
                    {question ? 'Save question' : 'Add question'}
                </Button>
            </div>
        </Dialog>
    )
}
