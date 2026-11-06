'use client'

import { useState } from 'react'
import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Input from '@/components/ui/Input'
import Segment from '@/components/ui/Segment'
import Alert from '@/components/ui/Alert'
import { Form, FormItem } from '@/components/ui/Form'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import ClientsPicker from '@/components/shared/ClientsPicker'
import CopyField from './CopyField'
import { describeApiKeyAccess } from './ApiKeyAccessLabel'
import { apiCreateApiKey, apiUpdateApiKey } from '@/services/integrations'
import { useApiKeysStore } from '@/stores/SettingsStores'
import {
    ApiKeyFormSchema,
    toCreateApiKeyInput,
    type ApiKeyAccess,
    type ApiKeyFormData,
} from '@/@types/integrations/forms/ApiKeyFormData'
import type { ApiKey, CreatedApiKey } from '@/@types/integrations/ApiKey'

const FORM_ID = 'api-key-form'

const ACCESS_OPTIONS: { value: ApiKeyAccess; label: string }[] = [
    { value: 'clients', label: 'Shared + chosen clients' },
    { value: 'all', label: 'Every client' },
]

/** After creating: the key, with a Copy button (it can be shown again later from the list) */
function NewKeyPanel({ created }: { created: CreatedApiKey }) {
    return (
        <>
            <p className="mb-3">
                <strong className="text-gray-900 dark:text-gray-100">{created.apiKey.name}</strong> can read{' '}
                {describeApiKeyAccess(created.apiKey)}.
            </p>
            <Alert type="info" showIcon className="mb-3">
                Paste it into Copilot Studio. Treat it like a password. If you need it again, use “Show key” in the
                list.
            </Alert>
            <div className="form-label mb-1">API key</div>
            <CopyField value={created.secret} what="the API key" />
        </>
    )
}

/**
 * Creates an agent API key, or edits one (`apiKey`): its name and what it may read — shared knowledge plus
 * the clients picked (several allowed), or every client.
 */
export default function ApiKeyDialog({ apiKey, onClose }: { apiKey?: ApiKey; onClose: () => void }) {
    const refresh = useApiKeysStore((s) => s.refresh)
    const [created, setCreated] = useState<CreatedApiKey | null>(null)
    const editing = !!apiKey

    const form = useForm<ApiKeyFormData>({
        resolver: zodResolver(ApiKeyFormSchema),
        defaultValues: {
            name: apiKey?.name ?? '',
            access: apiKey?.allClients ? 'all' : 'clients',
            clientIds: apiKey?.clients.map((c) => c.id) ?? [],
        },
    })
    const {
        control,
        formState: { errors, isSubmitting },
    } = form
    const access = useWatch({ control, name: 'access' })
    const clientIds = useWatch({ control, name: 'clientIds' })

    const onValid = async (data: ApiKeyFormData) => {
        try {
            if (apiKey) {
                const saved = await apiUpdateApiKey(apiKey.id, toCreateApiKeyInput(data))
                toastSuccess(`${saved.name} now reads ${describeApiKeyAccess(saved)}.`)
                void refresh()
                onClose()
            } else {
                setCreated(await apiCreateApiKey(toCreateApiKeyInput(data)))
                void refresh()
            }
        } catch (error) {
            toastError(editing ? 'The key couldn’t be saved.' : 'The key couldn’t be created.', error)
        }
    }

    if (created) {
        return (
            <ConfirmDialog
                isOpen
                onClose={onClose}
                type="success"
                title="Copy your new API key"
                confirmText="Done"
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
            title={editing ? `Edit ${apiKey.name}` : 'Create an API key'}
            confirmText={editing ? 'Save' : 'Create key'}
            confirmForm={FORM_ID}
            loading={isSubmitting}
            width={560}
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
                                    placeholder="e.g. Copilot Studio – Contoso assistant"
                                    invalid={!!errors.name}
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label="What it can read">
                        <Controller
                            name="access"
                            control={control}
                            render={({ field }) => (
                                <Segment
                                    size="sm"
                                    value={field.value}
                                    onChange={(value) => {
                                        if (typeof value === 'string' && value) field.onChange(value)
                                    }}
                                    aria-label="What it can read"
                                >
                                    {ACCESS_OPTIONS.map((option) => (
                                        <Segment.Item key={option.value} value={option.value} type="button">
                                            {option.label}
                                        </Segment.Item>
                                    ))}
                                </Segment>
                            )}
                        />
                    </FormItem>
                    {access === 'clients' && (
                        <FormItem label="Clients" htmlFor="api-key-clients">
                            <Controller
                                name="clientIds"
                                control={control}
                                render={({ field }) => (
                                    <ClientsPicker
                                        inputId="api-key-clients"
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="None: shared knowledge only"
                                    />
                                )}
                            />
                        </FormItem>
                    )}
                    <p className="text-xs text-gray-500">
                        {access === 'all'
                            ? 'The agent reads every published article and library asset, for every client. Use it only for an internal agent.'
                            : clientIds.length
                              ? 'The agent reads published shared knowledge plus the knowledge of these clients. Nothing about other clients.'
                              : 'With no clients picked, the agent reads published shared knowledge only.'}
                        {editing && ' Changes apply from the agent’s next request; the key itself stays the same.'}
                    </p>
                </Form>
            </FormProvider>
        </ConfirmDialog>
    )
}
