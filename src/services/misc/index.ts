import api from '@/services/api'
import type { EmailOnlyInput, ResetPasswordInput, SignInInput, SignUpInput } from '@/@types/auth/AuthSchema'

/* Small services that don't warrant their own folder: auth. */

export const apiSignIn = (input: SignInInput) =>
    api.fetchJson<void>({ method: 'post', url: '/auth/sign-in', data: input })

export const apiSignUp = (input: SignUpInput) =>
    api.fetchJson<{ needsConfirmation: boolean }>({ method: 'post', url: '/auth/sign-up', data: input })

export const apiResendConfirmation = (input: EmailOnlyInput) =>
    api.fetchJson<void>({ method: 'post', url: '/auth/resend', data: input })

export const apiSendSignInLink = (input: EmailOnlyInput) =>
    api.fetchJson<void>({ method: 'post', url: '/auth/magic-link', data: input })

export const apiForgotPassword = (input: EmailOnlyInput) =>
    api.fetchJson<void>({ method: 'post', url: '/auth/forgot-password', data: input })

export const apiResetPassword = (input: ResetPasswordInput) =>
    api.fetchJson<void>({ method: 'post', url: '/auth/reset-password', data: input })
