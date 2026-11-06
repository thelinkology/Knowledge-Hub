import type { Metadata } from 'next'
import AuthLayout from '@/components/auth/AuthLayout'
import ConfirmLinkCard from '@/components/auth/ConfirmLinkCard'
import SetupRequired from '@/components/shared/SetupRequired'
import { isSupabaseConfigured } from '@/server/data/supabase/config'

export const metadata: Metadata = { title: 'Continue', robots: { index: false, follow: false } }

interface ConfirmPageProps {
    searchParams: Promise<Record<string, string | string[] | undefined>>
}

const one = (value: string | string[] | undefined) => (typeof value === 'string' && value ? value : null)

/**
 * Where every auth email lands (sign-in link, invitation, password reset, email confirmation). Opening it
 * changes nothing: the person presses the button, which POSTs to ./verify. See ConfirmLinkCard for why.
 */
export default async function ConfirmPage({ searchParams }: ConfirmPageProps) {
    if (!isSupabaseConfigured()) return <SetupRequired />
    const params = await searchParams
    return (
        <AuthLayout>
            <ConfirmLinkCard
                tokenHash={one(params.token_hash)}
                type={one(params.type)}
                code={one(params.code)}
                next={one(params.next)}
            />
        </AuthLayout>
    )
}
