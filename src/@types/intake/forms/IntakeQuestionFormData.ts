import { z } from 'zod'
import { QUESTION_TYPES, QuestionOptionSchema, isChoiceType } from '@/@types/intake/IntakeQuestion'

/**
 * The question dialog. The product picker holds '' for "every product"; option rows are only checked
 * for choice questions. (The server validates IntakeQuestionSchema again — this is UX.)
 */
export const IntakeQuestionFormSchema = z
    .object({
        key: z
            .string()
            .trim()
            .regex(/^[a-z][a-z0-9_]{1,59}$/, 'Keys start with a letter and use lower-case letters, digits and _'),
        section: z.string().trim().min(2, 'Name the section').max(80),
        label: z.string().trim().min(2, 'Write the question').max(300),
        help: z.string().trim().max(1000, 'Keep the help text under 1,000 characters'),
        type: z.enum(QUESTION_TYPES),
        options: z.array(z.object({ value: z.string(), label: z.string() })).max(30, 'Use up to 30 options'),
        required: z.boolean(),
        productId: z.string(),
        position: z.number({ invalid_type_error: 'Enter a number' }).int().min(0).max(100000),
        active: z.boolean(),
    })
    .superRefine((q, ctx) => {
        if (!isChoiceType(q.type)) return
        if (q.options.length < 2) {
            ctx.addIssue({ code: 'custom', path: ['options'], message: 'Choice questions need at least two options' })
        }
        const seen = new Set<string>()
        q.options.forEach((option, index) => {
            const parsed = QuestionOptionSchema.safeParse(option)
            if (!parsed.success) {
                for (const issue of parsed.error.issues) {
                    ctx.addIssue({ code: 'custom', path: ['options', index, ...issue.path], message: issue.message })
                }
            }
            const value = option.value.trim()
            if (value && seen.has(value)) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['options', index, 'value'],
                    message: 'Each option needs a different value',
                })
            }
            seen.add(value)
        })
    })
export type IntakeQuestionFormData = z.infer<typeof IntakeQuestionFormSchema>
