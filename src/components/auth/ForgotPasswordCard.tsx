'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Form, FormItem } from '@/components/ui/Form'
import { EmailIcon } from '@/configs/icons.config'
import { signInPath } from '@/configs/app.config'
import { authMessages } from '@/configs/authMessages.config'
import { apiForgotPassword } from '@/services/misc'
import { EmailOnlySchema, type EmailOnlyInput } from '@/@types/auth/AuthSchema'
import { tryGetErrorMessage } from '@/utils/errors'

const m = authMessages.forgotPassword

/** Asks for a reset link. The reply is the same whether or not the email has an account (privacy). */
export default function ForgotPasswordCard({ linkExpired }: { linkExpired: boolean }) {
    const [sentTo, setSentTo] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const form = useForm<EmailOnlyInput>({ resolver: zodResolver(EmailOnlySchema), defaultValues: { email: '' } })
    const {
        control,
        formState: { errors, isSubmitting },
    } = form

    const onValid = async (input: EmailOnlyInput) => {
        setError(null)
        try {
            await apiForgotPassword(input)
            setSentTo(input.email)
        } catch (e) {
            setError(tryGetErrorMessage(e))
        }
    }

    const back = (
        <Link href={signInPath} className="mt-6 block text-center text-sm font-semibold text-primary hover:underline">
            {m.backToSignIn}
        </Link>
    )

    if (sentTo) {
        return (
            <div className="text-center">
                <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-subtle text-3xl text-primary">
                    <EmailIcon aria-hidden />
                </span>
                <h1 className="mb-2 text-2xl">{m.sentTitle}</h1>
                <p className="text-gray-600 dark:text-gray-300">{m.sent(sentTo)}</p>
                <ul className="mx-auto mt-4 max-w-sm space-y-1 text-left text-sm text-gray-500 dark:text-gray-400">
                    {authMessages.checkEmail.tips.map((tip) => (
                        <li key={tip} className="flex gap-2">
                            <span aria-hidden>•</span>
                            {tip}
                        </li>
                    ))}
                </ul>
                {back}
            </div>
        )
    }

    return (
        <>
            <h1 className="mb-1 text-2xl">{m.title}</h1>
            <p className="mb-6 text-gray-500 dark:text-gray-400">{m.subtitle}</p>
            {linkExpired && !error && (
                <Alert showIcon type="warning" className="mb-5">
                    {authMessages.resetPassword.noSession}
                </Alert>
            )}
            {error && (
                <Alert showIcon type="danger" className="mb-5">
                    {error}
                </Alert>
            )}
            <FormProvider {...form}>
                <Form onSubmit={form.handleSubmit(onValid)} noValidate>
                    <FormItem
                        label={authMessages.signIn.emailLabel}
                        htmlFor="email"
                        invalid={!!errors.email}
                        errorMessage={errors.email?.message}
                    >
                        <Controller
                            name="email"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    id="email"
                                    type="email"
                                    inputMode="email"
                                    autoComplete="email"
                                    invalid={!!errors.email}
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                    <Button block variant="solid" type="submit" loading={isSubmitting} icon={<EmailIcon />}>
                        {m.submit}
                    </Button>
                </Form>
            </FormProvider>
            {back}
        </>
    )
}
