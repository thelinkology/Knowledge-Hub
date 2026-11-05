import { z } from 'zod'

export const QUESTION_TYPES = ['text', 'long_text', 'single_choice', 'multi_choice', 'yes_no', 'number'] as const
export type QuestionType = (typeof QUESTION_TYPES)[number]

export const questionTypeLabel: Record<QuestionType, string> = {
    text: 'Short text',
    long_text: 'Long text',
    single_choice: 'Pick one',
    multi_choice: 'Pick any',
    yes_no: 'Yes / no',
    number: 'Number',
}

export const isChoiceType = (type: QuestionType) => type === 'single_choice' || type === 'multi_choice'

export const QuestionOptionSchema = z.object({
    value: z
        .string()
        .trim()
        .regex(/^[a-z0-9_]{1,40}$/, 'Option values use lower-case letters, digits and underscores'),
    label: z.string().trim().min(1).max(150),
})
export type QuestionOption = z.infer<typeof QuestionOptionSchema>

/** A discovery question. product set = only asked when that product is in scope. */
export interface IntakeQuestion {
    id: string
    key: string
    section: string
    label: string
    help: string
    type: QuestionType
    options: QuestionOption[]
    required: boolean
    productId: string | null
    position: number
    active: boolean
}

/** POST /api/admin/intake/questions, PUT /api/admin/intake/questions/[questionId] */
export const IntakeQuestionSchema = z
    .object({
        key: z
            .string()
            .trim()
            .regex(/^[a-z][a-z0-9_]{1,59}$/, 'Keys start with a letter and use lower-case letters, digits and _'),
        section: z.string().trim().min(2, 'Name the section').max(80),
        label: z.string().trim().min(2, 'Write the question').max(300),
        help: z.string().trim().max(1000).default(''),
        type: z.enum(QUESTION_TYPES),
        options: z.array(QuestionOptionSchema).max(30).default([]),
        required: z.boolean().default(false),
        productId: z.string().uuid().nullable().default(null),
        position: z.number().int().min(0).max(100000).default(0),
        active: z.boolean().default(true),
    })
    .refine((q) => !isChoiceType(q.type) || q.options.length >= 2, {
        message: 'Choice questions need at least two options',
        path: ['options'],
    })
    .refine((q) => new Set(q.options.map((o) => o.value)).size === q.options.length, {
        message: 'Each option needs a different value',
        path: ['options'],
    })
export type IntakeQuestionInput = z.infer<typeof IntakeQuestionSchema>
