'use client'

import { Controller, FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Form, FormItem } from '@/components/ui/Form'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { apiInviteUser } from '@/services/users'
import { useUsersStore } from '@/stores/AdminStores'
import { ROLES, roleLabel } from '@/@types/auth/Roles'
import { InviteUserSchema, type InviteUserInput } from '@/@types/users/UserAccount'
import { getErrorCode, tryGetErrorMessage } from '@/utils/errors'

const FORM_ID = 'invite-user-form'
const ROLE_OPTIONS = ROLES.map((role) => ({ value: role, label: roleLabel[role] }))

/** Invites someone by email with a role; Supabase emails them a link to set their password */
export default function InviteUserDialog({ onClose }: { onClose: () => void }) {
    const refresh = useUsersStore((s) => s.refresh)
    const form = useForm<InviteUserInput>({
        resolver: zodResolver(InviteUserSchema),
        defaultValues: { email: '', displayName: '', role: 'viewer' },
    })
    const {
        control,
        setError,
        formState: { errors, isSubmitting },
    } = form

    const onValid = async (input: InviteUserInput) => {
        try {
            await apiInviteUser(input)
            toastSuccess(`Invitation sent to ${input.email}.`)
            await refresh()
            onClose()
        } catch (error) {
            // Show the reason itself (e.g. the email service refused), not a generic headline
            if (getErrorCode(error) === 'ACCOUNT_EXISTS') {
                setError('email', {
                    message:
                        'This email already has an account, maybe still waiting for its confirmation email. Close this and use the envelope button next to them to email a sign-in link.',
                })
                return
            }
            toastError(`The invitation couldn’t be sent: ${tryGetErrorMessage(error)}`, error)
        }
    }

    return (
        <ConfirmDialog
            isOpen
            onClose={onClose}
            type="info"
            title="Invite someone"
            confirmText="Send invitation"
            confirmForm={FORM_ID}
            loading={isSubmitting}
        >
            <FormProvider {...form}>
                <Form id={FORM_ID} onSubmit={form.handleSubmit(onValid)} noValidate>
                    <FormItem
                        label="Work email"
                        htmlFor="invite-email"
                        asterisk
                        invalid={!!errors.email}
                        errorMessage={errors.email?.message}
                    >
                        <Controller
                            name="email"
                            control={control}
                            render={({ field }) => <Input id="invite-email" type="email" autoFocus {...field} />}
                        />
                    </FormItem>
                    <FormItem
                        label="Name"
                        htmlFor="invite-name"
                        asterisk
                        invalid={!!errors.displayName}
                        errorMessage={errors.displayName?.message}
                    >
                        <Controller
                            name="displayName"
                            control={control}
                            render={({ field }) => <Input id="invite-name" maxLength={60} {...field} />}
                        />
                    </FormItem>
                    <FormItem label="Role" htmlFor="invite-role">
                        <Controller
                            name="role"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    inputId="invite-role"
                                    options={ROLE_OPTIONS}
                                    value={ROLE_OPTIONS.find((o) => o.value === field.value)}
                                    onChange={(option) => option && field.onChange(option.value)}
                                    isSearchable={false}
                                />
                            )}
                        />
                    </FormItem>
                    <p className="text-xs text-gray-500">
                        They get an email with a link to set a password. The link expires after 24 hours.
                    </p>
                </Form>
            </FormProvider>
        </ConfirmDialog>
    )
}
