'use client'

import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Form } from '@/components/ui/Form'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import ClientFormFields from '../ClientFormFields'
import { toClientInput } from '../clientForm'
import { SaveIcon } from '@/configs/icons.config'
import { apiUpdateClient } from '@/services/clients'
import { useClientStore } from '@/stores/AppStores'
import { ClientSchema, type Client, type ClientInput } from '@/@types/clients/Client'
import useUnsavedChangesGuard from '@/utils/hooks/useUnsavedChangesGuard'

const FORM_ID = 'edit-client-form'

interface ClientEditFormProps {
    client: Client
    /** Called after saving or cancelling */
    onDone: () => void
}

/** Edits a client's details and account notes in place on the Overview tab */
export default function ClientEditForm({ client, onDone }: ClientEditFormProps) {
    const setData = useClientStore(client.id, (s) => s.setData)
    const form = useForm<ClientInput>({ resolver: zodResolver(ClientSchema), defaultValues: toClientInput(client) })
    const {
        formState: { isDirty, isSubmitting },
    } = form
    const guard = useUnsavedChangesGuard(() => form.formState.isDirty)

    const onValid = async (input: ClientInput) => {
        try {
            const saved = await apiUpdateClient(client.id, input)
            form.reset(toClientInput(saved))
            setData(saved)
            toastSuccess('Client saved.', { duration: 3000 })
            onDone()
        } catch (error) {
            toastError('The client couldn’t be saved.', error)
        }
    }

    const onInvalid = () => toastError('Some fields need attention — they’re highlighted in the form.')

    return (
        <FormProvider {...form}>
            <Card header={{ content: 'Edit client' }}>
                <Form id={FORM_ID} onSubmit={form.handleSubmit(onValid, onInvalid)} noValidate>
                    <ClientFormFields
                        showNotes
                        currentOwner={client.ownerId ? { id: client.ownerId, name: client.ownerName ?? 'Owner' } : null}
                    />
                    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
                        {isDirty && (
                            <span className="text-sm font-semibold text-warning sm:mr-auto" aria-live="polite">
                                Unsaved changes
                            </span>
                        )}
                        <Button type="button" onClick={onDone} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="solid"
                            icon={<SaveIcon />}
                            loading={isSubmitting}
                            disabled={!isDirty}
                        >
                            Save changes
                        </Button>
                    </div>
                </Form>
            </Card>
            <ConfirmDialog
                isOpen={!!guard.pendingHref}
                onClose={guard.stay}
                type="warning"
                title="Leave without saving?"
                confirmText="Leave"
                cancelText="Stay and save"
                onConfirm={guard.leave}
            >
                You have unsaved changes to this client. If you leave now, they’ll be lost.
            </ConfirmDialog>
        </FormProvider>
    )
}
