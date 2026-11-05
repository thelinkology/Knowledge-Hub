'use client'

import { useState } from 'react'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Alert from '@/components/ui/Alert'
import { Form, FormItem } from '@/components/ui/Form'
import { toastError } from '@/components/ui/toast/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import CopyField from './CopyField'
import { apiCreateApiKey } from '@/services/integrations'
import { useSWRClients } from '@/services/clients'
import { useApiKeysStore } from '@/stores/SettingsStores'
import { ApiKeyFormSchema, toCreateApiKeyInput, type ApiKeyFormData } from '@/@types/integrations/forms/ApiKeyFormData'
import type { CreatedApiKey } from '@/@types/integrations/ApiKey'

const FORM_ID = 'create-api-key-form'

/** Step 2: the key, shown this once */
function NewKeyPanel({ created }: { created: CreatedApiKey }) {
    return (
        <>
            <p className="mb-3">
                <strong className="text-gray-900 dark:text-gray-100">{created.apiKey.name}</strong> can read{' '}
                {created.apiKey.clientName
                    ? `published knowledge for ${created.apiKey.clientName} and shared knowledge`
                    : 'all published knowledge'}
                .
            </p>
            <Alert type="warning" showIcon className="mb-3">
                This is the only time the key is shown. Paste it into Copilot Studio (or a password manager) now. If you
                lose it, revoke it and create a new one.
            </Alert>
            <div className="form-label mb-1">API key</div>
            <CopyField value={created.secret} what="the API key" />
        </>
    )
}

/** Creates an agent API key (optionally limited to one client), then shows it once with a Copy button */
export default function CreateApiKeyDialog({ onClose }: { onClose: () => void }) {
    const refresh = useApiKeysStore((s) => s.refresh)
    const clients = useSWRClients()
    const [created, setCreated] = useState<CreatedApiKey | null>(null)

    const form = useForm<ApiKeyFormData>({
        resolver: zodResolver(ApiKeyFormSchema),
        defaultValues: { name: '', clientId: '' },
    })
    const {
        control,
        formState: { errors, isSubmitting },
    } = form

    const clientOptions = [
        { value: '', label: 'All clients (everything published)' },
        ...(clients.data ?? []).map((c) => ({ value: c.id, label: c.name })),
    ]

    const onValid = async (data: ApiKeyFormData) => {
        try {
            setCreated(await apiCreateApiKey(toCreateApiKeyInput(data)))
            void refresh()
        } catch (error) {
            toastError('The key couldn’t be created.', error)
        }
    }

    if (created) {
        return (
            <ConfirmDialog
                isOpen
                onClose={onClose}
                type="success"
                title="Copy your new API key"
                confirmText="I’ve copied it"
                onConfirm={onClose}
                width={600}
            >
                <NewKeyPanel created={created} />
            </ConfirmDialog>
        )
    }

    return (
        <ConfirmDialog
            isOpen
            onClose={onClose}
            type="info"
            title="Create an API key"
            confirmText="Create key"
            confirmForm={FORM_ID}
            loading={isSubmitting}
        >
            <FormProvider {...form}>
                <Form id={FORM_ID} onSubmit={form.handleSubmit(onValid)} noValidate>
                    <FormItem
                        label="Name"
                        htmlFor="api-key-name"
                        asterisk
                        invalid={!!errors.name}
                        errorMessage={errors.name?.message}
                    >
                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    id="api-key-name"
                                    maxLength={80}
                                    autoFocus
                                    autoComplete="off"
                                    placeholder="e.g. Copilot Studio – Delivery assistant"
                                    invalid={!!errors.name}
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label="What it can read" htmlFor="api-key-client">
                        <Controller
                            name="clientId"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    inputId="api-key-client"
                                    options={clientOptions}
                                    value={clientOptions.find((o) => o.value === field.value) ?? clientOptions[0]}
                                    onChange={(option) => field.onChange(option?.value ?? '')}
                                    isLoading={clients.isLoading}
                                    noOptionsMessage={() => 'No clients match'}
                                />
                            )}
                        />
                    </FormItem>
                    {clients.error && (
                        <p className="-mt-3 mb-4 text-xs text-error" role="alert">
                            Clients couldn’t be loaded, so the key can only be created for all clients right now.
                        </p>
                    )}
                    <p className="text-xs text-gray-500">
                        Agents only ever get published articles and library assets. A key for one client reads that
                        client’s knowledge plus shared knowledge — use it for an agent that works with that client.
                    </p>
                </Form>
            </FormProvider>
        </ConfirmDialog>
    )
}
