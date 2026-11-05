import 'server-only'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { requireSupabaseConfig } from './config'
import type { Database } from '@/@types/supabase/database.types'

/**
 * A Supabase client acting AS the signed-in user (session from cookies). Row level security applies,
 * so it is the safe default for reads. Writes go through `supabaseAdmin()` after an explicit check.
 */
export async function createUserClient() {
    const { url, publishableKey } = requireSupabaseConfig()
    const cookieStore = await cookies()
    return createServerClient<Database>(url, publishableKey, {
        cookies: {
            getAll: () => cookieStore.getAll(),
            setAll: (cookiesToSet) => {
                try {
                    cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
                } catch {
                    // Called from a Server Component, where cookies are read-only. The proxy refreshes the session.
                }
            },
        },
    })
}

export type UserSupabaseClient = Awaited<ReturnType<typeof createUserClient>>
