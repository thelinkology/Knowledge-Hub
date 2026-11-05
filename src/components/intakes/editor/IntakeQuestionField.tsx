'use client'

import { useController, useFormContext } from 'react-hook-form'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import Input from '@/components/ui/Input'
import Radio from '@/components/ui/Radio'
import Select from '@/components/ui/Select'
import { FormItem } from '@/components/ui/Form'
import { ProductTag } from '@/components/shared/KnowledgeTags'
import { questionFieldId } from './intakeForm'
import type { IntakeFormData } from '@/@types/intake/forms/IntakeFormData'
import type { IntakeQuestion } from '@/@types/intake/IntakeQuestion'
import type { Product } from '@/@types/products/Product'

/** Pick-one questions with more options than this use a dropdown instead of radio buttons */
const MAX_RADIO_OPTIONS = 6

const YES_NO = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
]

interface IntakeQuestionFieldProps {
    question: IntakeQuestion
    products: Product[]
}

/** One discovery question, with the input its type needs. Answers are strings (lists for pick-any). */
export default function IntakeQuestionField({ question, products }: IntakeQuestionFieldProps) {
    const { control } = useFormContext<IntakeFormData>()
    const { field } = useController({ control, name: `answers.${question.key}` })
    const id = questionFieldId(question.key)
    const helpId = question.help ? `${id}-help` : undefined
    const value = field.value
    const text = typeof value === 'string' ? value : Array.isArray(value) ? value.join(', ') : ''
    const productTag = question.productId ? (
        <ProductTag productId={question.productId} products={products} className="ml-2 align-middle" />
    ) : null
    const help = question.help ? (
        <p id={helpId} className="mb-2 text-xs text-gray-500 dark:text-gray-400">
            {question.help}
        </p>
    ) : null

    const isGroup =
        question.type === 'yes_no' ||
        question.type === 'multi_choice' ||
        (question.type === 'single_choice' && question.options.length <= MAX_RADIO_OPTIONS)

    if (isGroup) {
        const legend = (
            <legend className="form-label mb-2">
                {question.required && (
                    <span className="mr-1 text-error" aria-hidden>
                        *
                    </span>
                )}
                {question.label}
                {question.required && <span className="sr-only"> (required)</span>}
                {productTag}
            </legend>
        )
        const clear = text ? (
            <Button
                type="button"
                size="xs"
                variant="plain"
                className="mt-1"
                onClick={() => field.onChange(question.type === 'multi_choice' ? [] : '')}
            >
                Clear answer
            </Button>
        ) : null

        return (
            <fieldset id={id} className="mb-7" aria-describedby={helpId}>
                {legend}
                {help}
                {question.type === 'multi_choice' ? (
                    <Checkbox.Group
                        vertical
                        name={id}
                        value={Array.isArray(value) ? value : value ? [value] : []}
                        onChange={(next) => field.onChange(next)}
                    >
                        {question.options.map((option) => (
                            <Checkbox key={option.value} value={option.value}>
                                {option.label}
                            </Checkbox>
                        ))}
                    </Checkbox.Group>
                ) : (
                    <Radio.Group
                        vertical={question.type !== 'yes_no'}
                        name={id}
                        value={typeof value === 'string' ? value : ''}
                        onChange={(next: string) => field.onChange(next)}
                    >
                        {(question.type === 'yes_no' ? YES_NO : question.options).map((option) => (
                            <Radio key={option.value} value={option.value}>
                                {option.label}
                            </Radio>
                        ))}
                    </Radio.Group>
                )}
                {clear && <div>{clear}</div>}
            </fieldset>
        )
    }

    const options = question.options.map((o) => ({ value: o.value, label: o.label }))
    return (
        <FormItem label={question.label} htmlFor={id} asterisk={question.required} extra={productTag} className="mb-7">
            {help}
            {question.type === 'single_choice' ? (
                <Select
                    inputId={id}
                    options={options}
                    value={options.find((o) => o.value === text) ?? null}
                    onChange={(option) => field.onChange(option?.value ?? '')}
                    isClearable
                    placeholder="Choose one"
                    aria-describedby={helpId}
                />
            ) : question.type === 'long_text' ? (
                <Input
                    id={id}
                    textArea
                    rows={4}
                    maxLength={20000}
                    value={text}
                    onChange={(e) => field.onChange(e.target.value)}
                    onBlur={field.onBlur}
                    aria-describedby={helpId}
                    aria-required={question.required || undefined}
                />
            ) : (
                <Input
                    id={id}
                    type={question.type === 'number' ? 'number' : 'text'}
                    inputMode={question.type === 'number' ? 'decimal' : undefined}
                    maxLength={question.type === 'number' ? undefined : 2000}
                    className={question.type === 'number' ? 'max-w-60' : undefined}
                    value={text}
                    onChange={(e) => field.onChange(e.target.value)}
                    onBlur={field.onBlur}
                    aria-describedby={helpId}
                    aria-required={question.required || undefined}
                />
            )}
        </FormItem>
    )
}
