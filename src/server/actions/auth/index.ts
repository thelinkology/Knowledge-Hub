import 'server-only'
import { cache } from 'react'
import { notFound } from 'next/navigation'
import { createUserClient } from '@/server/data/supabase/server'
import { isSupabaseConfigured } from '@/server/data/supabase/config'
import {
    DataError,
    ForbiddenError,
    ServiceUnavailableError,
    TooManyRequestsError,
    UnauthorizedError,
} from '@/@types/errors'
import { hasPermission, rolePermissions, type Permission } from '@/@types/auth/Roles'
import type { SessionUser } from '@/@types/auth/SessionUser'
import { authMessages, type AuthErrorCode } from '@/configs/authMessages.config'
import type { EmailOnlyInput, ResetPasswordInput, SignInInput, SignUpInput } from '@/@types/auth/AuthSchema'
import { isAllowedSignUpEmail } from '@/utils/emailDomains'

/**
 * The signed-in user, or null. Verifies the session token (getClaims checks the JWT signature) and
 * reads the role from the database — never from anything the browser sends. Cached per request.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
    if (!isSupabaseConfigured()) return null
    const supabase = await createUserClient()
    const { data: claims } = await supabase.auth.getClaims()
    const userId = claims?.claims?.sub
    if (!userId) return null

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, display_name, role')
        .eq('id', userId)
        .maybeSingle()
    if (!profile) return null

    return {
        id: profile.id,
        email: profile.email,
        name: profile.display_name,
        role: profile.role,
        permissions: [...rolePermissions[profile.role]],
    }
})

export async function requireUser(): Promise<SessionUser> {
    const user = await getCurrentUser()
    if (!user) throw new UnauthorizedError()
    return user
}

export function assertPermission(user: SessionUser, permission: Permission) {
    if (!hasPermission(user.role, permission)) throw new ForbiddenError()
}

/**
 * For server pages: the signed-in user if they hold the permission; otherwise a 404 (pages a role
 * can't use simply don't exist for it). The portal layout has already redirected signed-out visitors.
 */
export async function requirePagePermission(permission: Permission): Promise<SessionUser> {
    const user = await getCurrentUser()
    if (!user || !hasPermission(user.role, permission)) notFound()
    return user
}

// ── Sign in / up / out ────────────────────────────────────────────────────────────────────────────
// Every message comes from configs/authMessages.config.ts so the wording lives in one place.

const authError = (code: AuthErrorCode, Kind: typeof DataError = DataError) => new Kind(authMessages.errors[code], code)

const authErrorFor = (error: { name?: string; message: string; status?: number; code?: string }) => {
    if (error.name === 'AuthRetryableFetchError' || error.status === 0) {
        return new ServiceUnavailableError(authMessages.errors.AUTH_UNAVAILABLE, 'AUTH_UNAVAILABLE')
    }
    if (error.status === 429 || error.code?.startsWith('over_')) {
        return new TooManyRequestsError(authMessages.errors.RATE_LIMITED)
    }
    switch (error.code) {
        case 'email_not_confirmed':
            return authError('EMAIL_NOT_CONFIRMED')
        case 'user_already_exists':
        case 'email_exists':
            return authError('ACCOUNT_EXISTS')
        case 'weak_password':
            return authError('WEAK_PASSWORD')
        case 'same_password':
            return authError('SAME_PASSWORD')
        case 'invalid_credentials':
            return authError('INVALID_CREDENTIALS')
        case 'session_not_found':
        case 'session_expired':
            return authError('RESET_SESSION_MISSING')
    }
    if (/already registered/i.test(error.message)) return authError('ACCOUNT_EXISTS')
    if (error.status === 400) return authError('INVALID_CREDENTIALS')
    console.error('[auth]', error)
    return authError('AUTH_FAILED')
}

/** Signs in with email and password */
export async function signIn({ login, password }: SignInInput) {
    const supabase = await createUserClient()
    const { error } = await supabase.auth.signInWithPassword({ email: login, password })
    if (error) throw authErrorFor(error)
}

/** Where email links land; `next` is where to go after the link is verified */
const confirmUrl = (origin: string, next: string) => `${origin}/auth/confirm?next=${encodeURIComponent(next)}`

/**
 * Creates a VIEWER account (roles are granted by an administrator). When SIGNUP_EMAIL_DOMAINS is set, only
 * those company domains may sign up. When email confirmation is on, no session is returned and the person is
 * asked to check their inbox.
 */
export async function signUp({ displayName, email, password }: SignUpInput, origin: string) {
    if (!isAllowedSignUpEmail(email, process.env.SIGNUP_EMAIL_DOMAINS)) throw authError('DOMAIN_NOT_ALLOWED')
    const supabase = await createUserClient()
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { display_name: displayName },
            emailRedirectTo: confirmUrl(origin, '/?welcome=1'),
        },
    })
    if (error) throw authErrorFor(error)
    // Supabase hides "already registered" when confirmation is on: it returns a user with no identities
    if (data.user && data.user.identities?.length === 0) throw authError('ACCOUNT_EXISTS')
    return { needsConfirmation: !data.session }
}

/** Sends the sign-up confirmation email again. Always "succeeds" so it can't reveal who has an account. */
export async function resendConfirmation({ email }: EmailOnlyInput, origin: string) {
    const supabase = await createUserClient()
    const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: confirmUrl(origin, '/?welcome=1') },
    })
    if (error && (error.status === 429 || error.code?.startsWith('over_'))) throw authErrorFor(error)
    if (error) console.warn('[auth] resend', error.code ?? error.message)
}

/** Emails a password-reset link. Always "succeeds" so it can't reveal who has an account. */
export async function requestPasswordReset({ email }: EmailOnlyInput, origin: string) {
    const supabase = await createUserClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: confirmUrl(origin, '/reset-password'),
    })
    if (error && (error.status === 429 || error.code?.startsWith('over_'))) throw authErrorFor(error)
    if (error) console.warn('[auth] reset', error.code ?? error.message)
}

/** Sets a new password for the signed-in user (after following a reset link, which signs them in). */
export async function updatePassword({ password }: ResetPasswordInput) {
    const supabase = await createUserClient()
    const { data } = await supabase.auth.getClaims()
    // A 400 (not 401) so the browser shows the message instead of redirecting to sign-in
    if (!data?.claims?.sub) throw authError('RESET_SESSION_MISSING')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw authErrorFor(error)
}

export async function signOut() {
    const supabase = await createUserClient()
    await supabase.auth.signOut()
}

export type EmailLinkType = 'signup' | 'email' | 'recovery' | 'email_change' | 'invite' | 'magiclink'

/**
 * Completes an email link and signs the person in. Our email templates send `token_hash` + `type`,
 * which works on any device (someone can sign up on a laptop and confirm on a phone). Supabase's
 * default templates send a PKCE `code`, which only works in the browser that started — both are handled.
 */
export async function verifyEmailLink(params: {
    code?: string | null
    tokenHash?: string | null
    type?: string | null
}) {
    const supabase = await createUserClient()
    if (params.tokenHash && params.type) {
        const { error } = await supabase.auth.verifyOtp({
            token_hash: params.tokenHash,
            type: params.type as EmailLinkType,
        })
        return !error
    }
    if (params.code) {
        const { error } = await supabase.auth.exchangeCodeForSession(params.code)
        return !error
    }
    return false
}
