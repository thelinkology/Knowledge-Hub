import { z } from 'zod'
import { RULE_KINDS, RULE_OPERATORS, VALUELESS_OPERATORS } from '@/@types/intake/IntakeRule'

/**
 * The rule dialog. The product picker holds '' for "every product". (The server validates
 * IntakeRuleSchema again, including that each condition's question and value exist — this is UX.)
 */
export const IntakeRuleFormSchema = z.object({
    title: z.string().trim().min(2, 'Name the rule').max(200),
    kind: z.enum(RULE_KINDS),
    productId: z.string(),
    match: z.enum(['all', 'any']),
    conditions: z
        .array(
            z
                .object({
                    questionKey: z.string().min(1, 'Choose a question'),
                    operator: z.enum(RULE_OPERATORS),
                    value: z.string().trim().max(200),
                })
                .refine((c) => VALUELESS_OPERATORS.includes(c.operator) || !!c.value, {
                    message: 'Choose or type a value',
                    path: ['value'],
                }),
        )
        .min(1, 'Add at least one condition')
        .max(20, 'Use up to 20 conditions'),
    guidance: z.string().trim().min(1, 'Write the guidance').max(20000),
    showToCustomer: z.boolean(),
    articleIds: z.array(z.string()).max(30, 'Link up to 30 articles'),
    assetIds: z.array(z.string()).max(30, 'Link up to 30 assets'),
    active: z.boolean(),
    position: z.number({ invalid_type_error: 'Enter a number' }).int().min(0).max(100000),
})
export type IntakeRuleFormData = z.infer<typeof IntakeRuleFormSchema>
