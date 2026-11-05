import { z } from 'zod'
import type { IntakeQuestion } from './IntakeQuestion'
import type { IntakeRule } from './IntakeRule'
import type { Product } from '@/@types/products/Product'

export const INTAKE_STATUSES = ['draft', 'in_review', 'complete'] as const
export type IntakeStatus = (typeof INTAKE_STATUSES)[number]

export const intakeStatusLabel: Record<IntakeStatus, string> = {
    draft: 'Draft',
    in_review: 'In review',
    complete: 'Complete',
}

export const intakeStatusTagClass: Record<IntakeStatus, string> = {
    draft: 'bg-warning-subtle text-warning border-transparent',
    in_review: 'bg-info-subtle text-info border-transparent',
    complete: 'bg-success-subtle text-success border-transparent',
}

/** An answer: text/number/choice/yes-no as a string, pick-any as a list */
export const AnswerSchema = z.union([z.string().max(20000), z.array(z.string().max(200)).max(50)])
export type Answer = z.infer<typeof AnswerSchema>
export type Answers = Record<string, Answer>

export interface IntakeSummary {
    id: string
    title: string
    status: IntakeStatus
    clientId: string
    clientName: string
    productIds: string[]
    brdCount: number
    updatedAt: Date
}

export interface Intake extends IntakeSummary {
    answers: Answers
    notes: string
    createdByName: string | null
    createdAt: Date
}

/** Everything the intake form needs: the intake plus the questions and rules to evaluate live */
export interface IntakeEditorData {
    intake: Intake
    questions: IntakeQuestion[]
    rules: IntakeRule[]
    products: Product[]
}

/** POST /api/intakes */
export const NewIntakeSchema = z.object({
    clientId: z.string().uuid({ message: 'Choose a client' }),
    title: z.string().trim().min(2, 'Give the intake a title').max(200),
    productIds: z.array(z.string().uuid()).max(20).default([]),
})
export type NewIntakeInput = z.infer<typeof NewIntakeSchema>

/** PUT /api/intakes/[intakeId] */
export const SaveIntakeSchema = z.object({
    title: z.string().trim().min(2, 'Give the intake a title').max(200),
    status: z.enum(INTAKE_STATUSES),
    productIds: z.array(z.string().uuid()).max(20),
    answers: z.record(z.string().regex(/^[a-z][a-z0-9_]{1,59}$/), AnswerSchema),
    notes: z.string().max(20000).default(''),
})
export type SaveIntakeInput = z.infer<typeof SaveIntakeSchema>

export const IntakesQuerySchema = z.object({
    clientId: z.string().uuid().optional(),
    status: z.enum(INTAKE_STATUSES).optional(),
})
export type IntakesQuery = z.infer<typeof IntakesQuerySchema>
