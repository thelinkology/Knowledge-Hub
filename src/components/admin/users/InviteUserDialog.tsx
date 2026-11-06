'use client'

import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Segment from '@/components/ui/Segment'
import { Form, FormItem } from '@/components/ui/Form'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import PasswordInput from '@/components/auth/PasswordInput'
import { apiInviteUser } from '@/services/users'
import { useUsersStore } from '@/stores/AdminStores'
import { ROLES, roleLabel } from '@/@types/auth/Roles'
import { InviteUserSchema, type AccessMethod, type InviteUserInput } from '@/@types/users/UserAccount'
import { getErrorCode, tryGetErrorMessage } from '@/utils/errors'

const FORM_ID = 'invite-user-form'
const ROLE_OPTIONS = ROLES.map((role) => ({ value: role, label: roleLabel[role] }))
const METHODS: { value: AccessMethod; label: string }[] = [
    { value: 'email', label: 'Email an invitation' },
    { value: 'password', label: 'Set a password now' },
]

/**
 * Gives someone access (the only way to get an account): Supabase emails them an invitation to set a
 * password, or the administrator sets a password now and shares it (no email needed).
 */
export default function InviteUserDialog({ onClose }: { onClose: () => void }) {
    const refresh = useUsersStore((s) => s.refresh)
    const form = useForm<InviteUserInput>({
        resolver: zodResolver(InviteUserSchema),
        defaultValues: { email: '', displayName: '', role: 'viewer', method: 'email', password: '' },
    })
    const {
        control,
        setError,
        clearErrors,
        formState: { errors, isSubmitting },
    } = form
    const method = useWatch({ control, name: 'method' })
    const byPassword = method === 'password'

    const onValid = async (input: InviteUserInput) => {
        try {
            await apiInviteUser(input)
            toastSuccess(
                input.method === 'password'
                    ? `Account created for ${input.email}. Share the password with them securely; they can change it with “Forgot your password?”.`
                    : `Invitation sent to ${input.email}.`,
            )
            await refresh()
            onClose()
        } catch (error) {
            // Show the reason itself (e.g. the email service refused), not a generic headline
            if (getErrorCode(error) === 'ACCOUNT_EXISTS') {
                setError('email', {
                    message:
                        'This email already has an account. Close this and use the envelope button next to them to email a sign-in link.',
                })
                return
            }
            if (getErrorCode(error) === 'WEAK_PASSWORD') {
                setError('password', { message: tryGetErrorMessage(error) })
                return
            }
            toastError(
                `${input.method === 'password' ? 'The account couldn’t be created' : 'The invitation couldn’t be sent'}: ${tryGetErrorMessage(error)}`,
                error,
            )
        }
    }

    return (
        <ConfirmDialog
            isOpen
            onClose={onClose}
            type="info"
            title="Add someone"
            confirmText={byPassword ? 'Create account' : 'Send invitation'}
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
                    <FormItem label="How they get in">
                        <Controller
                            name="method"
                            control={control}
                            render={({ field }) => (
                                <Segment
                                    size="sm"
                                    value={field.value}
                                    onChange={(value) => {
                                        if (typeof value !== 'string' || !value) return
                                        field.onChange(value)
                                        clearErrors('password')
                                    }}
                                    aria-label="How they get in"
                                >
                                    {METHODS.map((option) => (
                                        <Segment.Item key={option.value} value={option.value} type="button">
                                            {option.label}
                                        </Segment.Item>
                                    ))}
                                </Segment>
                            )}
                        />
                    </FormItem>
                    {byPassword && (
                        <FormItem
                            label="Password"
                            htmlFor="invite-password"
                            asterisk
                            invalid={!!errors.password}
                            errorMessage={errors.password?.message}
                        >
                            <Controller
                                name="password"
                                control={control}
                                render={({ field }) => (
                                    <PasswordInput
                                        id="invite-password"
                                        autoComplete="new-password"
                                        invalid={!!errors.password}
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>
                    )}
                    <p className="text-xs text-gray-500">
                        {byPassword
                            ? 'No email is sent: the account works straight away. Share the password with them securely, not in the same message as the email address.'
                            : 'They get an email with a link to set a password. The link expires after 24 hours.'}
                    </p>
                </Form>
            </FormProvider>
        </ConfirmDialog>
    )
}
