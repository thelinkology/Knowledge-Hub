import 'server-only'
import { ServiceUnavailableError } from '@/@types/errors'

/*
 * Supabase settings. All server-side: the browser never talks to Supabase directly (it calls our API
 * routes), so nothing needs a NEXT_PUBLIC_ prefix and the keys never reach the client bundle.
 * Supabase's newer key names are preferred; the legacy anon/service_role names still work.
 */

const read = (...names: string[]) => names.map((name) => process.env[name]).find((value) => !!value)

export const getSupabaseUrl = () => read('SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL')

export const getSupabasePublishableKey = () =>
    read('SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY')

export const getSupabaseSecretKey = () => read('SUPABASE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY')

export const isSupabaseConfigured = () => !!(getSupabaseUrl() && getSupabasePublishableKey() && getSupabaseSecretKey())

export function requireSupabaseConfig() {
    const url = getSupabaseUrl()
    const publishableKey = getSupabasePublishableKey()
    const secretKey = getSupabaseSecretKey()
    if (!url || !publishableKey || !secretKey) {
        throw new ServiceUnavailableError(
            'The database is not configured. Set SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY and SUPABASE_SECRET_KEY (see .env.example).',
            'DATABASE_NOT_CONFIGURED',
        )
    }
    return { url, publishableKey, secretKey }
}
