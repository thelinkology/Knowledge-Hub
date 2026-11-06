import 'server-only'
import { supabaseAdmin } from '@/server/data/supabase/admin'
import { check, unwrap, unwrapMaybe } from '@/server/data/supabase/errors'
import { recordAudit } from '@/server/actions/audit'
import { ConflictError, DataError, NotFoundError } from '@/@types/errors'
import type { SessionUser } from '@/@types/auth/SessionUser'
import type { Collection } from '@/@types/common'
import type {
    InviteUserInput,
    MyProfile,
    PersonOption,
    SetRoleInput,
    UpdateProfileInput,
    UserAccount,
    UsersQuery,
} from '@/@types/users/UserAccount'
import { USERS_PAGE_SIZE } from '@/constants/app.constant'

export async function getUsers({ q, role, page }: UsersQuery): Promise<Collection<UserAccount>> {
    let query = supabaseAdmin()
        .from('profiles')
        .select('id, email, display_name, role, created_at', { count: 'exact' })
        .order('display_name')
        .range((page - 1) * USERS_PAGE_SIZE, page * USERS_PAGE_SIZE - 1)
    if (role) query = query.eq('role', role)
    if (q) {
        // Escape PostgREST filter syntax characters before building the or() filter
        const term = q.replace(/[%_,()\\]/g, ' ').trim()
        if (term) query = query.or(`display_name.ilike.%${term}%,email.ilike.%${term}%`)
    }
    const result = await query
    return {
        total: result.count ?? 0,
        records: unwrap(result, 'load users').map((row) => ({
            id: row.id,
            email: row.email,
            displayName: row.display_name,
            role: row.role,
            createdAt: new Date(row.created_at),
        })),
    }
}

/** Editors and admins, for "owner" pickers */
export async function getPeople(): Promise<PersonOption[]> {
    return unwrap(
        await supabaseAdmin()
            .from('profiles')
            .select('id, display_name')
            .in('role', ['editor', 'admin'])
            .order('display_name')
            .limit(500),
        'load people',
    ).map((row) => ({ id: row.id, name: row.display_name }))
}

/** Administrators assign roles. You can't change your own role (so an admin can't lock everyone out). */
export async function setUserRole(admin: SessionUser, userId: string, { role }: SetRoleInput) {
    if (userId === admin.id)
        throw new ConflictError('You can’t change your own role. Ask another administrator.', 'OWN_ROLE')
    const db = supabaseAdmin()
    const profile = unwrapMaybe(
        await db.from('profiles').select('id, role, display_name').eq('id', userId).maybeSingle(),
        'find the user',
    )
    if (!profile) throw new NotFoundError('That user doesn’t exist.', 'USER_NOT_FOUND')
    if (profile.role === role) return
    check(await db.from('profiles').update({ role }).eq('id', userId), 'change the role')
    await recordAudit(admin.id, 'user.role_changed', 'user', userId, {
        name: profile.display_name,
        from: profile.role,
        to: role,
    })
}

/**
 * Invites someone by email: Supabase sends them a link to set a password. The profile is created by
 * handle_new_user (as a viewer); the role chosen here is then applied by the server.
 */
export async function inviteUser(admin: SessionUser, input: InviteUserInput, origin: string): Promise<UserAccount> {
    const db = supabaseAdmin()
    const existing = unwrapMaybe(
        await db.from('profiles').select('id').ilike('email', input.email).maybeSingle(),
        'check the email',
    )
    if (existing) throw new ConflictError('Someone with that email already has an account.', 'ACCOUNT_EXISTS')

    const { data, error } = await db.auth.admin.inviteUserByEmail(input.email, {
        data: { display_name: input.displayName },
        redirectTo: `${origin}/auth/confirm?next=${encodeURIComponent('/reset-password')}`,
    })
    if (error || !data.user) {
        console.error('[users] invite', error?.code ?? error?.message)
        if (error?.code === 'email_exists')
            throw new ConflictError('Someone with that email already has an account.', 'ACCOUNT_EXISTS')
        // Supabase's built-in email service only sends to the project's team members, a few emails an hour
        if (error?.code === 'email_address_not_authorized')
            throw new DataError(
                'Supabase’s built-in email service only sends to members of the Supabase project. Set up custom SMTP in Supabase (Authentication → Emails → SMTP settings), or add the person in Supabase (Authentication → Users → Add user).',
                'INVITE_FAILED',
            )
        if (error?.status === 429 || error?.code?.startsWith('over_'))
            throw new DataError(
                'The email limit was reached (Supabase’s built-in email service sends only a few emails an hour). Try again later, or set up custom SMTP in Supabase.',
                'INVITE_FAILED',
            )
        throw new DataError('Couldn’t send the invitation. Check the address and try again.', 'INVITE_FAILED')
    }
    if (input.role !== 'viewer') {
        check(await db.from('profiles').update({ role: input.role }).eq('id', data.user.id), 'set the role')
    }
    await recordAudit(admin.id, 'user.invited', 'user', data.user.id, { email: input.email, role: input.role })
    return {
        id: data.user.id,
        email: input.email,
        displayName: input.displayName,
        role: input.role,
        createdAt: new Date(),
    }
}

/** Removes the account (and, by cascade, its profile). Content they wrote stays, without an author. */
export async function deleteUserAccount(admin: SessionUser, userId: string) {
    if (userId === admin.id)
        throw new ConflictError('You can’t delete your own account here. Ask another administrator.', 'OWN_ACCOUNT')
    const db = supabaseAdmin()
    const profile = unwrapMaybe(
        await db.from('profiles').select('id, email, display_name').eq('id', userId).maybeSingle(),
        'find the user',
    )
    if (!profile) throw new NotFoundError('That user doesn’t exist.', 'USER_NOT_FOUND')
    const { error } = await db.auth.admin.deleteUser(userId)
    if (error) {
        console.error('[users] delete', error.code ?? error.message)
        throw new DataError('Couldn’t delete the account. Please try again.', 'DELETE_FAILED')
    }
    await recordAudit(admin.id, 'user.deleted', 'user', userId, { name: profile.display_name, email: profile.email })
}

// ── The signed-in user's own profile ──────────────────────────────────────────────────────────────

export async function getMyProfile(user: SessionUser): Promise<MyProfile> {
    const profile = unwrap(
        await supabaseAdmin().from('profiles').select('display_name, email, role').eq('id', user.id).single(),
        'load your profile',
    )
    return { displayName: profile.display_name, email: profile.email, role: profile.role }
}

export async function updateProfile(user: SessionUser, input: UpdateProfileInput): Promise<MyProfile> {
    check(
        await supabaseAdmin().from('profiles').update({ display_name: input.displayName }).eq('id', user.id),
        'update your profile',
    )
    return getMyProfile(user)
}
