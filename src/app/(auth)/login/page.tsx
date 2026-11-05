import type { Metadata } from 'next'
import AuthLayout from '@/components/auth/AuthLayout'
import SignInCard, { type SignInNotice } from '@/components/auth/SignInCard'
import SetupRequired from '@/components/shared/SetupRequired'
import { isSupabaseConfigured } from '@/server/data/supabase/config'
import { RETURN_TO_URL_KEY } from '@/constants/auth.constant'

export const metadata: Metadata = { title: 'Sign in' }

interface LoginPageProps {
    searchParams: Promise<Record<string, string | undefined>>
}

/** Query flags set by other flows → the friendly notice shown above the form */
function getNotice(params: Record<string, string | undefined>): SignInNotice | null {
    if (params.signedOut) return 'signedOut'
    if (params.error === 'link' || params.error === 'confirm') return 'linkExpired'
    if (params.expired) return 'sessionExpired'
    return null
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
    if (!isSupabaseConfigured()) return <SetupRequired />
    const params = await searchParams
    return (
        <AuthLayout>
            <SignInCard returnTo={params[RETURN_TO_URL_KEY] ?? null} notice={getNotice(params)} />
        </AuthLayout>
    )
}
