import { redirect } from 'next/navigation'
import PostLoginLayout from '@/components/template/PostLoginLayout'
import SessionProvider from '@/components/auth/SessionProvider'
import SetupRequired from '@/components/shared/SetupRequired'
import { getCurrentUser } from '@/server/actions/auth'
import { isSupabaseConfigured } from '@/server/data/supabase/config'
import { signInPath } from '@/configs/app.config'
import type { ProviderProps } from '@/@types/common'

/** Every page in the app shell: verifies the session on the server, then provides the user to the client. */
export default async function PortalLayout({ children }: ProviderProps) {
    if (!isSupabaseConfigured()) return <SetupRequired />
    const user = await getCurrentUser()
    if (!user) redirect(signInPath)
    return (
        <SessionProvider user={user}>
            <PostLoginLayout>{children}</PostLoginLayout>
        </SessionProvider>
    )
}
