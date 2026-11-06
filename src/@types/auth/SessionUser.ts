import type { Permission, Role } from './Roles'

/** The signed-in user, resolved on the server from the Supabase session + profile. */
export interface SessionUser {
    id: string
    email: string
    name: string
    role: Role
    permissions: Permission[]
    /**
     * The clients whose knowledge this person may read, besides shared knowledge. null = every client
     * (editors and administrators); viewers: the clients an administrator assigned them to.
     */
    clientIds: string[] | null
}
