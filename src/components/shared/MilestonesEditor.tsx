'use client'

import { useId, useState } from 'react'
import { Controller, get, useFieldArray, useFormContext, useFormState, type Control } from 'react-hook-form'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { FormItem } from '@/components/ui/Form'
import EmptyState from '@/components/shared/EmptyState'
import { AddIcon, DeleteIcon, MoveDownIcon, MoveUpIcon } from '@/configs/icons.config'
import navigationIcon from '@/configs/icons.config'
import classNames from '@/utils/classNames'
import type { Milestone } from '@/@types/brds/Milestone'

interface MilestonesEditorProps {
    /** Form path of a Milestone[] (e.g. "milestones" for a BRD, "milestoneTemplate" for a product) */
    name: string
    label?: string
    /** Most milestones allowed (the form's schema validates again) */
    max?: number
    className?: string
}

/*
 * react-hook-form can't type a field array at a path given as a plain string, so the editor works on
 * this shape and casts the path once. Any form with a Milestone[] at `name` works.
 */
type MilestonesForm = { items: Milestone[] }
type ItemPath = 'items'

const emptyMilestone = (): Milestone => ({ title: '', deliverables: [], dependencies: [], owner: '', due: '' })

const parseLines = (text: string) =>
    text
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)

const sameLines = (a: string[], b: string[]) => a.length === b.length && a.every((line, i) => line === b[i])

interface LinesTextareaProps {
    id: string
    value: string[] | undefined
    onChange: (lines: string[]) => void
    onBlur: () => void
    invalid?: boolean
    placeholder?: string
}

/** A list of short lines edited as text, one per line (blank lines dropped) */
function LinesTextarea({ id, value, onChange, onBlur, invalid, placeholder }: LinesTextareaProps) {
    const lines = value ?? []
    const [text, setText] = useState(() => lines.join('\n'))
    const [synced, setSynced] = useState(lines)
    // The form was reset or reordered: show the new value unless it's what the text already says.
    // (Compared by content: the form may hand over a new array with the same lines on every render.)
    if (!sameLines(synced, lines)) {
        setSynced(lines)
        if (!sameLines(parseLines(text), lines)) setText(lines.join('\n'))
    }
    return (
        <Input
            id={id}
            textArea
            rows={3}
            value={text}
            invalid={invalid}
            placeholder={placeholder}
            onBlur={onBlur}
            onChange={(e) => {
                const next = e.target.value
                const parsed = parseLines(next)
                setText(next)
                setSynced(parsed)
                onChange(parsed)
            }}
        />
    )
}

/**
 * Edits a delivery plan (Milestone[]) inside a react-hook-form FormProvider: title, owner, due, and
 * deliverables / dependencies one per line; add, remove and reorder. Used by the BRD editor and by
 * Admin → Products (milestone templates).
 */
export default function MilestonesEditor({ name, label, max = 40, className }: MilestonesEditorProps) {
    const baseId = useId()
    const { control: formControl } = useFormContext()
    const control = formControl as unknown as Control<MilestonesForm>
    const path = name as ItemPath
    const { fields, append, remove, move } = useFieldArray({ control, name: path })
    const { errors } = useFormState({ control, name: path })
    const listError: string | undefined = get(errors, `${name}.message`) ?? get(errors, `${name}.root.message`)

    const errorOf = (index: number, field: keyof Milestone): string | undefined => {
        const error = get(errors, `${name}.${index}.${field}`)
        return error?.message ?? (Array.isArray(error) ? error.find(Boolean)?.message : undefined)
    }

    return (
        <div className={classNames('space-y-3', className)}>
            {label && <h5 className="text-base">{label}</h5>}
            {fields.length === 0 ? (
                <EmptyState
                    compact
                    icon={navigationIcon.checklist}
                    title="No milestones yet"
                    description="Add the milestones of the plan, with what each delivers and depends on."
                    className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-600"
                />
            ) : (
                <ol className="space-y-3" aria-label={label ?? 'Milestones'}>
                    {fields.map((field, index) => {
                        const rowId = `${baseId}-${index}`
                        const titleError = errorOf(index, 'title')
                        const deliverablesError = errorOf(index, 'deliverables')
                        const dependenciesError = errorOf(index, 'dependencies')
                        return (
                            <li
                                key={field.id}
                                className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                            >
                                <div className="mb-2 flex items-center justify-between gap-2">
                                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                                        Milestone {index + 1}
                                    </span>
                                    <div className="flex gap-1">
                                        <Button
                                            type="button"
                                            size="xs"
                                            variant="plain"
                                            icon={<MoveUpIcon />}
                                            aria-label={`Move milestone ${index + 1} up`}
                                            disabled={index === 0}
                                            onClick={() => move(index, index - 1)}
                                        />
                                        <Button
                                            type="button"
                                            size="xs"
                                            variant="plain"
                                            icon={<MoveDownIcon />}
                                            aria-label={`Move milestone ${index + 1} down`}
                                            disabled={index === fields.length - 1}
                                            onClick={() => move(index, index + 1)}
                                        />
                                        <Button
                                            type="button"
                                            size="xs"
                                            variant="plain"
                                            icon={<DeleteIcon />}
                                            aria-label={`Remove milestone ${index + 1}`}
                                            onClick={() => remove(index)}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-x-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
                                    <FormItem
                                        label="Title"
                                        htmlFor={`${rowId}-title`}
                                        asterisk
                                        invalid={!!titleError}
                                        errorMessage={titleError}
                                    >
                                        <Controller
                                            control={control}
                                            name={`${path}.${index}.title`}
                                            render={({ field: input }) => (
                                                <Input
                                                    id={`${rowId}-title`}
                                                    maxLength={150}
                                                    invalid={!!titleError}
                                                    {...input}
                                                />
                                            )}
                                        />
                                    </FormItem>
                                    <FormItem label="Owner" htmlFor={`${rowId}-owner`}>
                                        <Controller
                                            control={control}
                                            name={`${path}.${index}.owner`}
                                            render={({ field: input }) => (
                                                <Input
                                                    id={`${rowId}-owner`}
                                                    maxLength={80}
                                                    placeholder="e.g. Client IT"
                                                    {...input}
                                                    value={input.value ?? ''}
                                                />
                                            )}
                                        />
                                    </FormItem>
                                    <FormItem label="Due" htmlFor={`${rowId}-due`}>
                                        <Controller
                                            control={control}
                                            name={`${path}.${index}.due`}
                                            render={({ field: input }) => (
                                                <Input
                                                    id={`${rowId}-due`}
                                                    maxLength={40}
                                                    placeholder="A date or “Week 3”"
                                                    {...input}
                                                    value={input.value ?? ''}
                                                />
                                            )}
                                        />
                                    </FormItem>
                                </div>
                                <div className="grid gap-x-4 sm:grid-cols-2">
                                    <FormItem
                                        label="Deliverables"
                                        htmlFor={`${rowId}-deliverables`}
                                        invalid={!!deliverablesError}
                                        errorMessage={deliverablesError}
                                        extra={
                                            <span className="ml-2 text-xs font-normal text-gray-500">One per line</span>
                                        }
                                        className="mb-0"
                                    >
                                        <Controller
                                            control={control}
                                            name={`${path}.${index}.deliverables`}
                                            render={({ field: input }) => (
                                                <LinesTextarea
                                                    id={`${rowId}-deliverables`}
                                                    value={input.value}
                                                    onChange={input.onChange}
                                                    onBlur={input.onBlur}
                                                    invalid={!!deliverablesError}
                                                    placeholder="What this milestone delivers"
                                                />
                                            )}
                                        />
                                    </FormItem>
                                    <FormItem
                                        label="Dependencies"
                                        htmlFor={`${rowId}-dependencies`}
                                        invalid={!!dependenciesError}
                                        errorMessage={dependenciesError}
                                        extra={
                                            <span className="ml-2 text-xs font-normal text-gray-500">One per line</span>
                                        }
                                        className="mb-0"
                                    >
                                        <Controller
                                            control={control}
                                            name={`${path}.${index}.dependencies`}
                                            render={({ field: input }) => (
                                                <LinesTextarea
                                                    id={`${rowId}-dependencies`}
                                                    value={input.value}
                                                    onChange={input.onChange}
                                                    onBlur={input.onBlur}
                                                    invalid={!!dependenciesError}
                                                    placeholder="What it needs first (access, licences, sign-off…)"
                                                />
                                            )}
                                        />
                                    </FormItem>
                                </div>
                            </li>
                        )
                    })}
                </ol>
            )}
            {listError && (
                <p className="text-sm text-error" role="alert">
                    {listError}
                </p>
            )}
            <Button
                type="button"
                size="sm"
                icon={<AddIcon />}
                disabled={fields.length >= max}
                onClick={() => append(emptyMilestone())}
            >
                Add milestone
            </Button>
        </div>
    )
}
