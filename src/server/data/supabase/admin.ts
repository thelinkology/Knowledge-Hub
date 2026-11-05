import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { requireSupabaseConfig } from './config'
import type { Database } from '@/@types/supabase/database.types'

let client: SupabaseClient<Database> | null = null

/**
 * Service-role client: bypasses row level security. Use it ONLY in server actions, and only after
 * authorising the user (assertPermission / requireCourseTeacher / requireEnrollment). It is the only
 * client that may call the game-state functions (award_xp, finalize_attempt, …).
 */
export function supabaseAdmin(): SupabaseClient<Database> {
    if (!client) {
        const { url, secretKey } = requireSupabaseConfig()
        client = createClient<Database>(url, secretKey, {
            auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        })
    }
    return client
}
