import type { Metadata } from 'next'
import AuthLayout from '@/components/auth/AuthLayout'
import ResetPasswordCard from '@/components/auth/ResetPasswordCard'
import SetupRequired from '@/components/shared/SetupRequired'
import { isSupabaseConfigured } from '@/server/data/supabase/config'
import { getCurrentUser } from '@/server/actions/auth'

export const metadata: Metadata = { title: 'Choose a new password' }

/** Reached from a reset email: the link signed the person in, so they can set a new password here. */
export default async function ResetPasswordPage() {
    if (!isSupabaseConfigured()) return <SetupRequired />
    const user = await getCurrentUser()
    return (
        <AuthLayout>
            <ResetPasswordCard hasSession={!!user} />
        </AuthLayout>
    )
}
