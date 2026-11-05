'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Form, FormItem } from '@/components/ui/Form'
import PasswordInput from './PasswordInput'
import CheckEmailPanel from './CheckEmailPanel'
import { AddUserIcon } from '@/configs/icons.config'
import { homePath, signInPath } from '@/configs/app.config'
import { authMessages } from '@/configs/authMessages.config'
import { apiSignUp } from '@/services/misc'
import { SignUpSchema, type SignUpInput } from '@/@types/auth/AuthSchema'
import { tryGetErrorMessage } from '@/utils/errors'

const m = authMessages.signUp

const Hint = ({ children }: { children: string }) => (
    <span className="text-xs text-gray-500 dark:text-gray-400">{children}</span>
)

/**
 * Sign-up. Everyone starts as a viewer (reads published knowledge); an administrator makes editors and
 * administrators. SIGNUP_EMAIL_DOMAINS can limit sign-up to company addresses (checked on the server).
 */
export default function SignUpCard() {
    const [error, setError] = useState<string | null>(null)
    const [awaitingConfirmation, setAwaitingConfirmation] = useState<string | null>(null)
    const form = useForm<SignUpInput>({
        resolver: zodResolver(SignUpSchema),
        defaultValues: { displayName: '', email: '', password: '' },
    })
    const {
        control,
        formState: { errors, isSubmitting },
    } = form

    const onValid = async (input: SignUpInput) => {
        setError(null)
        try {
            const { needsConfirmation } = await apiSignUp(input)
            if (needsConfirmation) setAwaitingConfirmation(input.email)
            // Full page load so the server renders the app with the new session cookie
            // eslint-disable-next-line @next/next/no-location-assign-relative-destination
            else window.location.assign(`${homePath}?welcome=1`)
        } catch (e) {
            setError(tryGetErrorMessage(e))
        }
    }

    if (awaitingConfirmation) return <CheckEmailPanel email={awaitingConfirmation} />

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
                        label={m.displayNameLabel}
                        htmlFor="displayName"
                        invalid={!!errors.displayName}
                        errorMessage={errors.displayName?.message}
                    >
                        <Controller
                            name="displayName"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    id="displayName"
                                    autoComplete="nickname"
                                    invalid={!!errors.displayName}
                                    {...field}
                                />
                            )}
                        />
                        <Hint>{m.displayNameHint}</Hint>
                    </FormItem>
                    <FormItem
                        label={m.emailLabel}
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
                        <Hint>{m.emailHint}</Hint>
                    </FormItem>
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
                        <Hint>{m.passwordHint}</Hint>
                    </FormItem>
                    <Button block variant="solid" type="submit" loading={isSubmitting} icon={<AddUserIcon />}>
                        {m.submit}
                    </Button>
                </Form>
            </FormProvider>
            <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                {m.haveAccount}{' '}
                <Link href={signInPath} className="font-semibold text-primary hover:underline">
                    {m.signIn}
                </Link>
            </p>
        </>
    )
}
