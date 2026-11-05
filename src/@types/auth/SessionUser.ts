import type { Permission, Role } from './Roles'

/** The signed-in user, resolved on the server from the Supabase session + profile. */
export interface SessionUser {
    id: string
    email: string
    name: string
    role: Role
    permissions: Permission[]
}
