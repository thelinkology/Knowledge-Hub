'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Form, FormItem } from '@/components/ui/Form'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import ProductMultiSelect from './ProductMultiSelect'
import { apiCreateIntake } from '@/services/intake'
import { useSWRClients } from '@/services/clients'
import { useProductsStore } from '@/stores/AppStores'
import { getIntakePath } from '@/configs/app.config'
import { NewIntakeSchema, type NewIntakeInput } from '@/@types/intake/Intake'
import type { ClientSummary } from '@/@types/clients/Client'

const FORM_ID = 'new-intake-form'

interface NewIntakeDialogProps {
    /** Preselects the client (e.g. from the client's page) */
    clientId?: string
    onClose: () => void
}

const defaultTitle = (client: ClientSummary) => `${client.name} discovery`

/** Starts a discovery intake for a client, then opens it. Products default to the client's products. */
export default function NewIntakeDialog({ clientId, onClose }: NewIntakeDialogProps) {
    const router = useRouter()
    // Picker data local to this dialog
    const { data: clients, isLoading } = useSWRClients()
    const products = useProductsStore((s) => s.data)
    const form = useForm<NewIntakeInput>({
        resolver: zodResolver(NewIntakeSchema),
        defaultValues: { clientId: clientId ?? '', title: '', productIds: [] },
    })
    const {
        control,
        setValue,
        getValues,
        formState: { errors, isSubmitting },
    } = form

    const clientOptions = (clients ?? []).map((c) => ({ value: c.id, label: c.name }))

    /** A newly chosen client brings its products (and a title, when none was typed) */
    const applyClient = (client: ClientSummary | undefined) => {
        if (!client) return
        setValue('productIds', client.productIds)
        if (!getValues('title').trim()) setValue('title', defaultTitle(client))
    }

    // A preselected client: apply its defaults once, when the client list arrives
    const applied = useRef(false)
    useEffect(() => {
        if (applied.current || !clientId || !clients) return
        applied.current = true
        const client = clients.find((c) => c.id === clientId)
        if (!client) return
        if (!form.getFieldState('productIds').isDirty) form.setValue('productIds', client.productIds)
        if (!form.getValues('title').trim()) form.setValue('title', defaultTitle(client))
    }, [clients, clientId, form])

    const onValid = async (input: NewIntakeInput) => {
        try {
            const intake = await apiCreateIntake(input)
            toastSuccess('Intake created. Work through the questions and save as you go.', { duration: 4000 })
            onClose()
            router.push(getIntakePath(intake.id))
        } catch (error) {
            toastError('The intake couldn’t be created.', error)
        }
    }

    return (
        <ConfirmDialog
            isOpen
            onClose={onClose}
            type="info"
            title="New discovery intake"
            confirmText="Create intake"
            confirmForm={FORM_ID}
            loading={isSubmitting}
        >
            <FormProvider {...form}>
                <Form id={FORM_ID} onSubmit={form.handleSubmit(onValid)} noValidate>
                    <FormItem
                        label="Client"
                        htmlFor="new-intake-client"
                        asterisk
                        invalid={!!errors.clientId}
                        errorMessage={errors.clientId?.message}
                    >
                        <Controller
                            name="clientId"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    inputId="new-intake-client"
                                    options={clientOptions}
                                    isLoading={isLoading}
                                    value={clientOptions.find((o) => o.value === field.value) ?? null}
                                    onChange={(option) => {
                                        field.onChange(option?.value ?? '')
                                        applyClient(clients?.find((c) => c.id === option?.value))
                                    }}
                                    placeholder="Choose a client"
                                    noOptionsMessage={() => 'No clients yet. Add one under Clients first.'}
                                    isDisabled={!!clientId}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem
                        label="Title"
                        htmlFor="new-intake-title"
                        asterisk
                        invalid={!!errors.title}
                        errorMessage={errors.title?.message}
                    >
                        <Controller
                            name="title"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    id="new-intake-title"
                                    maxLength={200}
                                    placeholder="e.g. FY26 planning discovery"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Products in scope" htmlFor="new-intake-products">
                        <Controller
                            name="productIds"
                            control={control}
                            render={({ field }) => (
                                <ProductMultiSelect
                                    inputId="new-intake-products"
                                    products={products}
                                    value={field.value ?? []}
                                    onChange={field.onChange}
                                    aria-describedby="new-intake-products-help"
                                />
                            )}
                        />
                    </FormItem>
                    <p id="new-intake-products-help" className="-mt-3 text-xs text-gray-500">
                        Product-specific questions and rules follow these. They default to the client’s products, and
                        you can change them later.
                    </p>
                </Form>
            </FormProvider>
        </ConfirmDialog>
    )
}
