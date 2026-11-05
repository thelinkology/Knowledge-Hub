'use client'

import { Controller, useFormContext, useWatch } from 'react-hook-form'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { FormItem } from '@/components/ui/Form'
import MarkdownBodyEditor from '@/components/shared/editor/MarkdownBodyEditor'
import { CLIENT_FIELD_IDS } from './clientForm'
import { useProductsStore } from '@/stores/AppStores'
import { usePeopleStore } from '@/stores/LibraryStores'
import { CLIENT_STATUSES, clientStatusLabel, type ClientInput } from '@/@types/clients/Client'
import type { Option } from '@/@types/common'

const STATUS_OPTIONS = CLIENT_STATUSES.map((status) => ({ value: status, label: clientStatusLabel[status] }))

interface ClientFormFieldsProps {
    /** Account notes (Markdown editor) — when editing an existing client */
    showNotes?: boolean
    /** The saved owner, kept selectable even if they're no longer an editor */
    currentOwner?: { id: string; name: string } | null
}

/** The client form's fields (inside a FormProvider of ClientInput) */
export default function ClientFormFields({ showNotes, currentOwner }: ClientFormFieldsProps) {
    const {
        control,
        formState: { errors },
    } = useFormContext<ClientInput>()
    const products = useProductsStore((s) => s.data)
    const people = usePeopleStore((s) => s.data)
    const peopleLoading = usePeopleStore((s) => s.loading)
    const selectedProductIds = useWatch({ control, name: 'productIds' })

    const productOptions: Option[] = (products ?? [])
        .filter((p) => p.active || selectedProductIds.includes(p.id))
        .map((p) => ({ value: p.id, label: p.name }))
    const ownerOptions: Option[] = [
        { value: '', label: 'No owner' },
        ...(people ?? []).map((p) => ({ value: p.id, label: p.name })),
        ...(currentOwner && !people?.some((p) => p.id === currentOwner.id)
            ? [{ value: currentOwner.id, label: currentOwner.name }]
            : []),
    ]

    return (
        <>
            <div className="grid gap-x-4 md:grid-cols-2">
                <FormItem
                    label="Name"
                    htmlFor={CLIENT_FIELD_IDS.name}
                    asterisk
                    invalid={!!errors.name}
                    errorMessage={errors.name?.message}
                >
                    <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                            <Input id={CLIENT_FIELD_IDS.name} maxLength={120} autoComplete="off" {...field} />
                        )}
                    />
                </FormItem>
                <FormItem
                    label="Industry"
                    htmlFor={CLIENT_FIELD_IDS.industry}
                    invalid={!!errors.industry}
                    errorMessage={errors.industry?.message}
                >
                    <Controller
                        name="industry"
                        control={control}
                        render={({ field }) => (
                            <Input
                                id={CLIENT_FIELD_IDS.industry}
                                maxLength={80}
                                placeholder="e.g. Retail, Mining, Financial services"
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                <FormItem
                    label="Website"
                    htmlFor={CLIENT_FIELD_IDS.website}
                    invalid={!!errors.website}
                    errorMessage={errors.website?.message}
                >
                    <Controller
                        name="website"
                        control={control}
                        render={({ field }) => (
                            <Input
                                id={CLIENT_FIELD_IDS.website}
                                type="url"
                                inputMode="url"
                                placeholder="https://"
                                maxLength={300}
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                <FormItem label="Status" htmlFor={CLIENT_FIELD_IDS.status}>
                    <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                            <Select
                                inputId={CLIENT_FIELD_IDS.status}
                                options={STATUS_OPTIONS}
                                value={STATUS_OPTIONS.find((o) => o.value === field.value)}
                                onChange={(option) => option && field.onChange(option.value)}
                                isSearchable={false}
                            />
                        )}
                    />
                </FormItem>
                <FormItem label="Products" htmlFor={CLIENT_FIELD_IDS.products}>
                    <Controller
                        name="productIds"
                        control={control}
                        render={({ field }) => (
                            <Select<Option, true>
                                inputId={CLIENT_FIELD_IDS.products}
                                isMulti
                                options={productOptions}
                                placeholder="Products in use or in scope"
                                value={productOptions.filter((o) => field.value.includes(o.value))}
                                onChange={(options) => field.onChange(options.map((o) => o.value))}
                                onBlur={field.onBlur}
                            />
                        )}
                    />
                </FormItem>
                <FormItem label="Owner" htmlFor={CLIENT_FIELD_IDS.owner}>
                    <Controller
                        name="ownerId"
                        control={control}
                        render={({ field }) => (
                            <Select
                                inputId={CLIENT_FIELD_IDS.owner}
                                options={ownerOptions}
                                isLoading={peopleLoading && !people}
                                value={ownerOptions.find((o) => o.value === (field.value ?? '')) ?? ownerOptions[0]}
                                onChange={(option) => field.onChange(option?.value || null)}
                            />
                        )}
                    />
                </FormItem>
            </div>
            <FormItem
                label="Summary"
                htmlFor={CLIENT_FIELD_IDS.summary}
                invalid={!!errors.summary}
                errorMessage={errors.summary?.message}
                extra={
                    <span className="ml-2 text-xs font-normal text-gray-500">Who they are, in a sentence or two.</span>
                }
            >
                <Controller
                    name="summary"
                    control={control}
                    render={({ field }) => (
                        <Input id={CLIENT_FIELD_IDS.summary} textArea rows={2} maxLength={500} {...field} />
                    )}
                />
            </FormItem>
            {showNotes && (
                <MarkdownBodyEditor<ClientInput>
                    name="notes"
                    id={CLIENT_FIELD_IDS.notes}
                    label="Account notes"
                    hint="Stakeholders, environments, decisions, history — anything the next person on the account needs"
                    placeholder="Write account notes… Use Insert to add images, tip boxes and tables."
                />
            )}
        </>
    )
}
