import { z } from 'zod'
import { authMessages } from '@/configs/authMessages.config'

const v = authMessages.validation

export const DisplayNameSchema = z
    .string()
    .trim()
    .min(1, v.displayName)
    .max(60, v.displayNameLength)
    .regex(/^[^<>]*$/, v.displayNameChars)

export const EmailSchema = z.string().trim().toLowerCase().email(v.email)
export const NewPasswordSchema = z.string().min(8, v.passwordLength).max(72, v.passwordMax)

export const SignInSchema = z.object({
    login: EmailSchema,
    password: z.string().min(1, v.password),
})
export type SignInInput = z.infer<typeof SignInSchema>

export const SignUpSchema = z.object({
    displayName: DisplayNameSchema,
    email: EmailSchema,
    password: NewPasswordSchema,
})
export type SignUpInput = z.infer<typeof SignUpSchema>

/** Also used to resend the confirmation email */
export const EmailOnlySchema = z.object({ email: EmailSchema })
export type EmailOnlyInput = z.infer<typeof EmailOnlySchema>

export const ResetPasswordSchema = z
    .object({ password: NewPasswordSchema, confirm: z.string() })
    .refine((p) => p.password === p.confirm, { message: v.passwordsMatch, path: ['confirm'] })
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>
