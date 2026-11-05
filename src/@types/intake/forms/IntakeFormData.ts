import { z } from 'zod'
import { AnswerSchema, INTAKE_STATUSES } from '@/@types/intake/Intake'

/**
 * The intake form. Answers are keyed by question key; untouched questions have no entry.
 * (The server validates SaveIntakeSchema again and tidies the answers — this is UX.)
 */
export const IntakeFormSchema = z.object({
    title: z.string().trim().min(2, 'Give the intake a title').max(200),
    status: z.enum(INTAKE_STATUSES),
    productIds: z.array(z.string()).max(20, 'Choose up to 20 products'),
    answers: z.record(z.string(), AnswerSchema.optional()),
    notes: z.string().max(20000, 'Keep the notes under 20,000 characters'),
})
export type IntakeFormData = z.infer<typeof IntakeFormSchema>
