'use client'

import { Controller, FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Form, FormItem } from '@/components/ui/Form'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import {
    CollectionFormSchema,
    toCollectionFormData,
    toCollectionInput,
    type CollectionFormData,
} from './knowledgeForms'
import { apiCreateCollection, apiUpdateCollection } from '@/services/knowledge'
import { useSWRClients } from '@/services/clients'
import { useProductsStore } from '@/stores/AppStores'
import type { KnowledgeCollection } from '@/@types/knowledge/KnowledgeCollection'
import type { PublishStatus } from '@/@types/shared/PublishStatusOptions'

const FORM_ID = 'collection-form'

const STATUS_OPTIONS: { value: PublishStatus; label: string }[] = [
    { value: 'draft', label: 'Draft — only editors see it' },
    { value: 'published', label: 'Published — everyone can browse it' },
    { value: 'archived', label: 'Archived — hidden from browsing' },
]

interface CollectionDialogProps {
    onClose: () => void
    /** The collection to edit; omit to create one */
    collection?: KnowledgeCollection | null
    onSaved: (collection: KnowledgeCollection) => void
}

/** Creates or edits a collection (title, summary, client, product and whether it's published) */
export default function CollectionDialog({ onClose, collection, onSaved }: CollectionDialogProps) {
    const editing = !!collection
    const clients = useSWRClients()
    const products = useProductsStore((s) => s.data)
    const form = useForm<CollectionFormData>({
        resolver: zodResolver(CollectionFormSchema),
        defaultValues: toCollectionFormData(collection ?? null),
    })
    const {
        control,
        formState: { errors, isSubmitting },
    } = form

    const clientOptions = [
        { value: '', label: 'Shared (all clients)' },
        ...(clients.data ?? []).map((c) => ({ value: c.id, label: c.name })),
    ]
    const productOptions = [
        { value: '', label: 'No specific product' },
        ...(products ?? [])
            .filter((p) => p.active || p.id === collection?.productId)
            .map((p) => ({ value: p.id, label: p.name })),
    ]
    // Archiving is offered for an existing collection only
    const statusOptions = editing ? STATUS_OPTIONS : STATUS_OPTIONS.filter((o) => o.value !== 'archived')

    const onValid = async (values: CollectionFormData) => {
        try {
            const input = toCollectionInput(values)
            const saved = collection
                ? await apiUpdateCollection(collection.id, input)
                : await apiCreateCollection(input)
            toastSuccess(editing ? 'Collection saved.' : 'Collection created. Add its articles next.', {
                duration: 4000,
            })
            onSaved(saved)
        } catch (error) {
            toastError(editing ? 'The collection couldn’t be saved.' : 'The collection couldn’t be created.', error)
        }
    }

    return (
        <ConfirmDialog
            isOpen
            onClose={onClose}
            type="info"
            title={editing ? 'Edit collection' : 'New collection'}
            confirmText={editing ? 'Save' : 'Create collection'}
            confirmForm={FORM_ID}
            loading={isSubmitting}
            width={600}
        >
            <FormProvider {...form}>
                <Form id={FORM_ID} onSubmit={form.handleSubmit(onValid)} noValidate>
                    <FormItem
                        label="Title"
                        htmlFor="collection-title"
                        asterisk
                        invalid={!!errors.title}
                        errorMessage={errors.title?.message}
                    >
                        <Controller
                            name="title"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    id="collection-title"
                                    maxLength={150}
                                    autoFocus
                                    autoComplete="off"
                                    invalid={!!errors.title}
                                    placeholder="e.g. Getting started with Fabric"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem
                        label="Summary"
                        htmlFor="collection-summary"
                        invalid={!!errors.summary}
                        errorMessage={errors.summary?.message}
                    >
                        <Controller
                            name="summary"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    id="collection-summary"
                                    textArea
                                    rows={3}
                                    maxLength={500}
                                    placeholder="What someone will learn or be able to do after reading it"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                    <div className="grid gap-x-4 sm:grid-cols-2">
                        <FormItem label="Client" htmlFor="collection-client">
                            <Controller
                                name="clientId"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        inputId="collection-client"
                                        options={clientOptions}
                                        isLoading={clients.isLoading}
                                        value={clientOptions.find((o) => o.value === field.value) ?? clientOptions[0]}
                                        onChange={(option) => field.onChange(option?.value ?? '')}
                                    />
                                )}
                            />
                        </FormItem>
                        <FormItem label="Product" htmlFor="collection-product">
                            <Controller
                                name="productId"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        inputId="collection-product"
                                        options={productOptions}
                                        value={productOptions.find((o) => o.value === field.value) ?? productOptions[0]}
                                        onChange={(option) => field.onChange(option?.value ?? '')}
                                        isSearchable={false}
                                    />
                                )}
                            />
                        </FormItem>
                    </div>
                    <FormItem label="Status" htmlFor="collection-status">
                        <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    inputId="collection-status"
                                    options={statusOptions}
                                    value={statusOptions.find((o) => o.value === field.value) ?? statusOptions[0]}
                                    onChange={(option) => option && field.onChange(option.value)}
                                    isSearchable={false}
                                />
                            )}
                        />
                    </FormItem>
                    <p className="text-xs text-gray-500">
                        Viewers only see the published articles of a published collection.
                    </p>
                </Form>
            </FormProvider>
        </ConfirmDialog>
    )
}
