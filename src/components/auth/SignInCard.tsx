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
import { EmailIcon, SignInIcon } from '@/configs/icons.config'
import { forgotPasswordPath, homePath } from '@/configs/app.config'
import { authMessages } from '@/configs/authMessages.config'
import { apiSendSignInLink, apiSignIn } from '@/services/misc'
import { EmailSchema, SignInSchema, type SignInInput } from '@/@types/auth/AuthSchema'
import { getErrorCode, tryGetErrorMessage } from '@/utils/errors'
import { safeReturnPath } from '@/utils/returnTo'

export type SignInNotice = keyof typeof authMessages.notices

interface SignInCardProps {
    returnTo: string | null
    notice: SignInNotice | null
}

const m = authMessages.signIn

const safeReturnTo = (value: string | null) => safeReturnPath(value, homePath)

const NOTICE_TYPE: Record<SignInNotice, 'success' | 'info' | 'warning'> = {
    signedOut: 'success',
    emailConfirmed: 'success',
    passwordUpdated: 'success',
    linkExpired: 'warning',
    sessionExpired: 'info',
}

export default function SignInCard({ returnTo, notice }: SignInCardProps) {
    const [error, setError] = useState<{ text: string; code?: string } | null>(null)
    const [resendFor, setResendFor] = useState<string | null>(null)
    const [linkSentTo, setLinkSentTo] = useState<string | null>(null)
    const [sendingLink, setSendingLink] = useState(false)
    const form = useForm<SignInInput>({
        resolver: zodResolver(SignInSchema),
        defaultValues: { login: '', password: '' },
    })
    const {
        control,
        getValues,
        setError: setFieldError,
        clearErrors,
        formState: { errors, isSubmitting },
    } = form

    /** "Email me a sign-in link": uses the email typed above, no password */
    const sendLink = async () => {
        setError(null)
        setLinkSentTo(null)
        const email = EmailSchema.safeParse(getValues('login'))
        if (!email.success) {
            setFieldError('login', { message: m.magicLinkNeedsEmail })
            document.getElementById('login')?.focus()
            return
        }
        clearErrors()
        setSendingLink(true)
        try {
            await apiSendSignInLink({ email: email.data, ...(returnTo ? { returnTo } : {}) })
            setLinkSentTo(email.data)
        } catch (e) {
            setError({ text: tryGetErrorMessage(e), code: getErrorCode(e) })
        } finally {
            setSendingLink(false)
        }
    }

    const onValid = async (input: SignInInput) => {
        setError(null)
        try {
            await apiSignIn(input)
            // Full navigation so the server renders the app with the new session cookie
            window.location.assign(safeReturnTo(returnTo))
        } catch (e) {
            setError({ text: tryGetErrorMessage(e), code: getErrorCode(e) })
        }
    }

    if (resendFor) return <CheckEmailPanel email={resendFor} />

    return (
        <>
            <h1 className="mb-1 text-2xl">{m.title}</h1>
            <p className="mb-6 text-gray-500 dark:text-gray-400">{m.subtitle}</p>
            {linkSentTo && !error && (
                <Alert showIcon type="success" className="mb-5">
                    {m.magicLinkSent(linkSentTo)}
                </Alert>
            )}
            {notice && !error && !linkSentTo && (
                <Alert showIcon type={NOTICE_TYPE[notice]} className="mb-5">
                    {authMessages.notices[notice]}
                </Alert>
            )}
            {error && (
                <Alert showIcon type="danger" className="mb-5">
                    {error.text}
                    {error.code === 'EMAIL_NOT_CONFIRMED' && (
                        <button
                            type="button"
                            className="ml-1 font-semibold underline"
                            onClick={() => setResendFor(getValues('login'))}
                        >
                            {authMessages.checkEmail.resend}
                        </button>
                    )}
                </Alert>
            )}
            <FormProvider {...form}>
                <Form onSubmit={form.handleSubmit(onValid)} noValidate>
                    <FormItem
                        label={m.loginLabel}
                        htmlFor="login"
                        invalid={!!errors.login}
                        errorMessage={errors.login?.message}
                    >
                        <Controller
                            name="login"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    id="login"
                                    type="email"
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                    spellCheck={false}
                                    autoComplete="username"
                                    invalid={!!errors.login}
                                    {...field}
                                />
                            )}
                        />
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
                                    autoComplete="current-password"
                                    invalid={!!errors.password}
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                    <div className="-mt-2 mb-5 text-right">
                        <Link href={forgotPasswordPath} className="text-sm font-semibold text-primary hover:underline">
                            {m.forgotPassword}
                        </Link>
                    </div>
                    <Button block variant="solid" type="submit" loading={isSubmitting} icon={<SignInIcon />}>
                        {m.submit}
                    </Button>
                </Form>
            </FormProvider>
            <div className="my-5 flex items-center gap-3 text-xs text-gray-400" aria-hidden>
                <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                {m.orDivider}
                <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
            </div>
            <Button
                block
                type="button"
                loading={sendingLink}
                icon={<EmailIcon />}
                aria-describedby="magic-link-hint"
                onClick={() => void sendLink()}
            >
                {m.magicLink}
            </Button>
            <p id="magic-link-hint" className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
                {m.magicLinkHint}
            </p>
            <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">{m.noAccount}</p>
        </>
    )
}
