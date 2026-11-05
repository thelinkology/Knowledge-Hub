'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import { Form, FormItem } from '@/components/ui/Form'
import PasswordInput from './PasswordInput'
import { PasswordIcon } from '@/configs/icons.config'
import { forgotPasswordPath, homePath } from '@/configs/app.config'
import { authMessages } from '@/configs/authMessages.config'
import { apiResetPassword } from '@/services/misc'
import { ResetPasswordSchema, type ResetPasswordInput } from '@/@types/auth/AuthSchema'
import { tryGetErrorMessage } from '@/utils/errors'

const m = authMessages.resetPassword

/** Chooses a new password. The reset link has already signed the person in (see /auth/confirm). */
export default function ResetPasswordCard({ hasSession }: { hasSession: boolean }) {
    const [error, setError] = useState<string | null>(null)
    const form = useForm<ResetPasswordInput>({
        resolver: zodResolver(ResetPasswordSchema),
        defaultValues: { password: '', confirm: '' },
    })
    const {
        control,
        formState: { errors, isSubmitting },
    } = form

    if (!hasSession) {
        return (
            <>
                <h1 className="mb-2 text-2xl">{m.title}</h1>
                <Alert showIcon type="warning" className="mb-5">
                    {m.noSession}
                </Alert>
                <Link href={forgotPasswordPath} className="block">
                    <Button block variant="solid">
                        {m.requestNew}
                    </Button>
                </Link>
            </>
        )
    }

    const onValid = async (input: ResetPasswordInput) => {
        setError(null)
        try {
            await apiResetPassword(input)
            // Full page load so the server renders the app with the new session cookie
            // eslint-disable-next-line @next/next/no-location-assign-relative-destination
            window.location.assign(`${homePath}?passwordUpdated=1`)
        } catch (e) {
            setError(tryGetErrorMessage(e))
        }
    }

    return (
        <>
            <h1 className="mb-1 text-2xl">{m.title}</h1>
            <p className="mb-6 text-gray-500 dark:text-gray-400">{m.subtitle}</p>
            {error && (
                <Alert showIcon type="danger" className="mb-5">
                    {error}
                </Alert>
            )}
            <FormProvider {...form}>
                <Form onSubmit={form.handleSubmit(onValid)} noValidate>
                    <FormItem
                        label={m.passwordLabel}
                        htmlFor="password"
                        invalid={!!errors.password}
                        errorMessage={errors.password?.message}
                    >
                        <Controller
                            name="password"
                            control={control}
                            render={({ field }) => (
                                <PasswordInput
                                    id="password"
                                    autoComplete="new-password"
                                    invalid={!!errors.password}
                                    {...field}
                                />
                            )}
                        />
                        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                            {authMessages.signUp.passwordHint}
                        </p>
                    </FormItem>
                    <FormItem
                        label={m.confirmLabel}
                        htmlFor="confirm"
                        invalid={!!errors.confirm}
                        errorMessage={errors.confirm?.message}
                    >
                        <Controller
                            name="confirm"
                            control={control}
                            render={({ field }) => (
                                <PasswordInput
                                    id="confirm"
                                    autoComplete="new-password"
                                    invalid={!!errors.confirm}
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                    <Button block variant="solid" type="submit" loading={isSubmitting} icon={<PasswordIcon />}>
                        {m.submit}
                    </Button>
                </Form>
            </FormProvider>
        </>
    )
}
