import type { Metadata } from 'next'
import AuthLayout from '@/components/auth/AuthLayout'
import ForgotPasswordCard from '@/components/auth/ForgotPasswordCard'
import SetupRequired from '@/components/shared/SetupRequired'
import { isSupabaseConfigured } from '@/server/data/supabase/config'

export const metadata: Metadata = { title: 'Reset your password' }

interface ForgotPasswordPageProps {
    searchParams: Promise<Record<string, string | undefined>>
}

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
    if (!isSupabaseConfigured()) return <SetupRequired />
    const { error } = await searchParams
    return (
        <AuthLayout>
            <ForgotPasswordCard linkExpired={error === 'link'} />
        </AuthLayout>
    )
}
