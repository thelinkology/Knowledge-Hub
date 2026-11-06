'use client'

import { useRouter } from 'next/navigation'
import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Form, FormItem } from '@/components/ui/Form'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { apiCreateAsset } from '@/services/library'
import { useProductsStore } from '@/stores/AppStores'
import { useClientOptionsStore } from '@/stores/LibraryStores'
import { getAssetEditPath } from '@/configs/app.config'
import { ASSET_KINDS, assetKindLabel, type AssetKind } from '@/@types/library/Asset'
import { NewAssetFormSchema, type NewAssetFormData } from '@/@types/library/forms/AssetFormData'
import type { ClientOption } from '@/@types/clients/Client'

const FORM_ID = 'new-asset-form'
const KIND_OPTIONS = ASSET_KINDS.map((kind) => ({ value: kind, label: assetKindLabel[kind] }))

interface NewAssetDialogProps {
    onClose: () => void
    defaultKind?: AssetKind | null
    /** On a client's page: the asset belongs to this client (no client picker) */
    client?: ClientOption
}

/** Creates a draft asset and opens its editor */
export default function NewAssetDialog({ onClose, defaultKind, client }: NewAssetDialogProps) {
    const router = useRouter()
    const products = useProductsStore((s) => s.data)
    const clients = useClientOptionsStore((s) => s.data)
    const form = useForm<NewAssetFormData>({
        resolver: zodResolver(NewAssetFormSchema),
        defaultValues: { title: '', kind: defaultKind ?? 'script', clientId: client?.id ?? '', productId: '' },
    })
    const {
        control,
        formState: { errors, isSubmitting },
    } = form
    const kind = useWatch({ control, name: 'kind' })

    const productOptions = [
        { value: '', label: 'No specific product' },
        ...(products ?? []).filter((p) => p.active).map((p) => ({ value: p.id, label: p.name })),
    ]
    const clientOptions = [
        { value: '', label: 'Shared (all clients)' },
        ...(clients ?? []).map((c) => ({ value: c.id, label: c.name })),
    ]

    const onValid = async (values: NewAssetFormData) => {
        try {
            const asset = await apiCreateAsset({
                title: values.title.trim(),
                kind: values.kind,
                clientId: values.clientId || null,
                productId: values.productId || null,
            })
            toastSuccess('Draft created. Add the details, then publish it.', { duration: 4000 })
            router.push(getAssetEditPath(asset.id))
        } catch (error) {
            toastError('The asset couldn’t be created.', error)
        }
    }

    return (
        <ConfirmDialog
            isOpen
            onClose={onClose}
            type="info"
            title={client ? `New asset for ${client.name}` : 'New library asset'}
            confirmText="Create and edit"
            confirmForm={FORM_ID}
            loading={isSubmitting}
        >
            <FormProvider {...form}>
                <Form id={FORM_ID} onSubmit={form.handleSubmit(onValid)} noValidate>
                    <FormItem
                        label="Title"
                        htmlFor="new-asset-title"
                        asterisk
                        invalid={!!errors.title}
                        errorMessage={errors.title?.message}
                    >
                        <Controller
                            name="title"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    id="new-asset-title"
                                    autoFocus
                                    maxLength={200}
                                    placeholder="e.g. Fabric lakehouse refresh notebook"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Type" htmlFor="new-asset-kind">
                        <Controller
                            name="kind"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    inputId="new-asset-kind"
                                    options={KIND_OPTIONS}
                                    value={KIND_OPTIONS.find((o) => o.value === field.value)}
                                    onChange={(option) => option && field.onChange(option.value)}
                                    isSearchable={false}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Product" htmlFor="new-asset-product">
                        <Controller
                            name="productId"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    inputId="new-asset-product"
                                    options={productOptions}
                                    value={productOptions.find((o) => o.value === field.value) ?? productOptions[0]}
                                    onChange={(option) => field.onChange(option?.value ?? '')}
                                    isSearchable={false}
                                />
                            )}
                        />
                    </FormItem>
                    {!client && (
                        <FormItem label="Client" htmlFor="new-asset-client">
                            <Controller
                                name="clientId"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        inputId="new-asset-client"
                                        options={clientOptions}
                                        value={clientOptions.find((o) => o.value === field.value) ?? clientOptions[0]}
                                        onChange={(option) => field.onChange(option?.value ?? '')}
                                    />
                                )}
                            />
                        </FormItem>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        It starts as a draft that only editors can see.{' '}
                        {kind === 'reference_architecture'
                            ? 'The architecture diagram designer opens next: start from a template or draw it from scratch.'
                            : 'You’ll add the instructions, link and code next.'}
                    </p>
                </Form>
            </FormProvider>
        </ConfirmDialog>
    )
}
