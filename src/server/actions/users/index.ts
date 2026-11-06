import 'server-only'
import { supabaseAdmin } from '@/server/data/supabase/admin'
import { check, unwrap, unwrapMaybe } from '@/server/data/supabase/errors'
import { recordAudit } from '@/server/actions/audit'
import { sendSignInLink } from '@/server/actions/auth'
import { assertClientsExist } from '@/server/actions/clients'
import { ConflictError, DataError, NotFoundError } from '@/@types/errors'
import type { SessionUser } from '@/@types/auth/SessionUser'
import type { Collection } from '@/@types/common'
import type {
    InviteUserInput,
    MyProfile,
    PersonOption,
    SetRoleInput,
    SetUserClientsInput,
    UpdateProfileInput,
    UserAccount,
    UsersQuery,
} from '@/@types/users/UserAccount'
import { USERS_PAGE_SIZE } from '@/constants/app.constant'

export async function getUsers({ q, role, page }: UsersQuery): Promise<Collection<UserAccount>> {
    let query = supabaseAdmin()
        .from('profiles')
        .select('id, email, display_name, role, created_at, client_members(client:clients(id, name))', {
            count: 'exact',
        })
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
            clients: (row.client_members as { client: { id: string; name: string } | null }[])
                .map((m) => m.client)
                .filter((c): c is { id: string; name: string } => !!c)
                .sort((a, b) => a.name.localeCompare(b.name)),
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
 * Creates an account (the only way in: there is no self sign-up). Either Supabase emails an invitation
 * with a link to set a password, or — no email needed — the account is created confirmed with the
 * password the administrator chose, to share with the person. The profile is created by handle_new_user
 * (as a viewer); the role chosen here is then applied by the server.
 */
export async function inviteUser(admin: SessionUser, input: InviteUserInput, origin: string): Promise<UserAccount> {
    const db = supabaseAdmin()
    // Checked first, so a bad client doesn't leave an account behind
    const clientIds = await assertClientsExist(input.clientIds)
    const existing = unwrapMaybe(
        await db.from('profiles').select('id').ilike('email', input.email).maybeSingle(),
        'check the email',
    )
    if (existing) throw new ConflictError('Someone with that email already has an account.', 'ACCOUNT_EXISTS')

    const { data, error } =
        input.method === 'password'
            ? await db.auth.admin.createUser({
                  email: input.email,
                  password: input.password,
                  email_confirm: true,
                  user_metadata: { display_name: input.displayName },
              })
            : await db.auth.admin.inviteUserByEmail(input.email, {
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
                'Supabase’s email limit was reached: too many emails in the last hour. Wait and try again, or raise the limit in Supabase → Authentication → Rate limits (with custom SMTP; the built-in service allows only a few an hour).',
                'INVITE_FAILED',
            )
        if (error?.code === 'weak_password')
            throw new DataError('That password is too easy to guess. Choose a longer one.', 'WEAK_PASSWORD')
        // The SMTP server refused or didn't answer (wrong settings, or SMTP sign-in blocked in Microsoft 365)
        if (input.method === 'email' && (error?.status === 504 || /email/i.test(error?.message ?? '')))
            throw new DataError(
                'Supabase couldn’t send the email through your mail server. Supabase → Logs → Auth shows why (often SMTP sign-in is blocked in Microsoft 365). Meanwhile, you can create the account with a password instead.',
                'INVITE_FAILED',
            )
        throw new DataError(
            input.method === 'password'
                ? 'Couldn’t create the account. Check the details and try again.'
                : 'Couldn’t send the invitation. Check the address and try again.',
            'INVITE_FAILED',
        )
    }
    if (input.role !== 'viewer') {
        check(await db.from('profiles').update({ role: input.role }).eq('id', data.user.id), 'set the role')
    }
    if (clientIds.length) {
        check(
            await db
                .from('client_members')
                .insert(clientIds.map((clientId) => ({ client_id: clientId, user_id: data.user.id }))),
            'assign the clients',
        )
    }
    await recordAudit(admin.id, input.method === 'password' ? 'user.created' : 'user.invited', 'user', data.user.id, {
        email: input.email,
        role: input.role,
        clientIds,
    })
    return {
        id: data.user.id,
        email: input.email,
        displayName: input.displayName,
        role: input.role,
        clients: [],
        createdAt: new Date(),
    }
}

/**
 * Sets the clients someone is assigned to (replacing the old list). A viewer reads shared knowledge plus
 * these clients' knowledge; editors and administrators read every client anyway, so for them it's only a
 * record of who works with whom.
 */
export async function setUserClients(admin: SessionUser, userId: string, input: SetUserClientsInput) {
    const db = supabaseAdmin()
    const profile = unwrapMaybe(
        await db.from('profiles').select('id, display_name').eq('id', userId).maybeSingle(),
        'find the user',
    )
    if (!profile) throw new NotFoundError('That user doesn’t exist.', 'USER_NOT_FOUND')
    const clientIds = await assertClientsExist(input.clientIds)
    const current = unwrap(
        await db.from('client_members').select('client_id').eq('user_id', userId),
        'load their clients',
    ).map((row) => row.client_id)
    const removed = current.filter((id) => !clientIds.includes(id))
    const added = clientIds.filter((id) => !current.includes(id))
    if (removed.length) {
        check(
            await db.from('client_members').delete().eq('user_id', userId).in('client_id', removed),
            'update their clients',
        )
    }
    if (added.length) {
        check(
            await db.from('client_members').upsert(
                added.map((clientId) => ({ client_id: clientId, user_id: userId })),
                { ignoreDuplicates: true },
            ),
            'update their clients',
        )
    }
    if (removed.length || added.length) {
        await recordAudit(admin.id, 'user.clients_changed', 'user', userId, {
            name: profile.display_name,
            added,
            removed,
        })
    }
}

/** Emails the person a one-time sign-in link (Supabase's "Magic link" email) and records it */
export async function sendUserSignInLink(admin: SessionUser, userId: string, origin: string) {
    const profile = unwrapMaybe(
        await supabaseAdmin().from('profiles').select('id, email').eq('id', userId).maybeSingle(),
        'find the user',
    )
    if (!profile) throw new NotFoundError('That user doesn’t exist.', 'USER_NOT_FOUND')
    await sendSignInLink(profile.email, origin, { reveal: true })
    await recordAudit(admin.id, 'user.sign_in_link_sent', 'user', profile.id, { email: profile.email })
    return { email: profile.email }
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
