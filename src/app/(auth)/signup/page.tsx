import type { Metadata } from 'next'
import AuthLayout from '@/components/auth/AuthLayout'
import SignUpCard from '@/components/auth/SignUpCard'
import SetupRequired from '@/components/shared/SetupRequired'
import { isSupabaseConfigured } from '@/server/data/supabase/config'

export const metadata: Metadata = { title: 'Create your account' }

export default function SignUpPage() {
    if (!isSupabaseConfigured()) return <SetupRequired />
    return (
        <AuthLayout>
            <SignUpCard />
        </AuthLayout>
    )
}
