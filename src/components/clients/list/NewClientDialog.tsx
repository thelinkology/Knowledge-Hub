'use client'

import { useRouter } from 'next/navigation'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/Form'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import ClientFormFields from '../ClientFormFields'
import { emptyClientInput } from '../clientForm'
import { apiCreateClient } from '@/services/clients'
import { getClientPath } from '@/configs/app.config'
import { ClientSchema, type ClientInput } from '@/@types/clients/Client'

const FORM_ID = 'new-client-form'

/** Adds a client, then opens their page */
export default function NewClientDialog({ onClose }: { onClose: () => void }) {
    const router = useRouter()
    const form = useForm<ClientInput>({ resolver: zodResolver(ClientSchema), defaultValues: emptyClientInput() })
    const {
        formState: { isSubmitting },
    } = form

    const onValid = async (input: ClientInput) => {
        try {
            const client = await apiCreateClient(input)
            toastSuccess(`${client.name} added.`, { duration: 4000 })
            router.push(getClientPath(client.id))
        } catch (error) {
            toastError('The client couldn’t be added.', error)
        }
    }

    return (
        <ConfirmDialog
            isOpen
            onClose={onClose}
            type="info"
            title="New client"
            confirmText="Add client"
            confirmForm={FORM_ID}
            loading={isSubmitting}
            width={760}
        >
            <FormProvider {...form}>
                <Form id={FORM_ID} onSubmit={form.handleSubmit(onValid)} noValidate>
                    <ClientFormFields />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        You can add account notes, knowledge and assets on the client’s page next.
                    </p>
                </Form>
            </FormProvider>
        </ConfirmDialog>
    )
}
