import { z } from 'zod'
import { DisplayNameSchema, EmailSchema, NewPasswordSchema } from '@/@types/auth/AuthSchema'
import { ROLES, type Role } from '@/@types/auth/Roles'

export interface UserAccount {
    id: string
    email: string
    displayName: string
    role: Role
    createdAt: Date
}

/** Someone who can be an owner (editors and admins) */
export interface PersonOption {
    id: string
    name: string
}

export const UsersQuerySchema = z.object({
    q: z.string().trim().max(100).optional(),
    role: z.enum(ROLES).optional(),
    page: z.coerce.number().int().min(1).max(10000).default(1),
})
export type UsersQuery = z.infer<typeof UsersQuerySchema>

export const SetRoleSchema = z.object({ role: z.enum(ROLES) })
export type SetRoleInput = z.infer<typeof SetRoleSchema>

/** POST /api/admin/users — invites someone by email with a role */
/** How a new account gets in: an emailed invitation, or a password the administrator sets and shares */
export const ACCESS_METHODS = ['email', 'password'] as const
export type AccessMethod = (typeof ACCESS_METHODS)[number]

/** POST /api/admin/users: accounts are only ever created by administrators */
export const InviteUserSchema = z
    .object({
        email: EmailSchema,
        displayName: DisplayNameSchema,
        role: z.enum(ROLES).default('viewer'),
        method: z.enum(ACCESS_METHODS).default('email'),
        password: z.string().max(72).default(''),
    })
    .superRefine((input, ctx) => {
        if (input.method !== 'password') return
        const check = NewPasswordSchema.safeParse(input.password)
        if (!check.success) ctx.addIssue({ code: 'custom', path: ['password'], message: check.error.issues[0].message })
    })
export type InviteUserInput = z.infer<typeof InviteUserSchema>

/** PATCH /api/me/profile */
export const UpdateProfileSchema = z.object({ displayName: DisplayNameSchema })
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>

export interface MyProfile {
    displayName: string
    email: string
    role: Role
}
