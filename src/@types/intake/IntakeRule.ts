import { z } from 'zod'

export const RULE_KINDS = ['gotcha', 'best_practice'] as const
export type RuleKind = (typeof RULE_KINDS)[number]

export const ruleKindLabel: Record<RuleKind, string> = {
    gotcha: 'Gotcha',
    best_practice: 'Best practice',
}

export const ruleKindTagClass: Record<RuleKind, string> = {
    gotcha: 'bg-warning-subtle text-warning border-transparent',
    best_practice: 'bg-success-subtle text-success border-transparent',
}

/**
 * How a condition compares an answer. Answers are strings (text, number, a choice value, "yes"/"no") or
 * string arrays (pick-any). See utils/intakeRules.ts.
 */
export const RULE_OPERATORS = [
    'equals',
    'not_equals',
    'includes',
    'not_includes',
    'contains',
    'answered',
    'not_answered',
    'greater_than',
    'less_than',
] as const
export type RuleOperator = (typeof RULE_OPERATORS)[number]

export const ruleOperatorLabel: Record<RuleOperator, string> = {
    equals: 'is',
    not_equals: 'is not',
    includes: 'includes',
    not_includes: 'doesn’t include',
    contains: 'contains the text',
    answered: 'is answered',
    not_answered: 'is not answered',
    greater_than: 'is more than',
    less_than: 'is less than',
}

/** Operators that don't compare with a value */
export const VALUELESS_OPERATORS: readonly RuleOperator[] = ['answered', 'not_answered']

export const RuleConditionSchema = z.object({
    questionKey: z.string().trim().min(2).max(60),
    operator: z.enum(RULE_OPERATORS),
    value: z.string().trim().max(200).default(''),
})
export type RuleCondition = z.infer<typeof RuleConditionSchema>

/** IF the conditions match THEN the guidance (and its links) is added to the BRDs */
export interface IntakeRule {
    id: string
    title: string
    kind: RuleKind
    productId: string | null
    match: 'all' | 'any'
    conditions: RuleCondition[]
    guidance: string
    showToCustomer: boolean
    articleIds: string[]
    assetIds: string[]
    active: boolean
    position: number
}

/** POST /api/admin/intake/rules, PUT /api/admin/intake/rules/[ruleId] */
export const IntakeRuleSchema = z.object({
    title: z.string().trim().min(2, 'Name the rule').max(200),
    kind: z.enum(RULE_KINDS),
    productId: z.string().uuid().nullable().default(null),
    match: z.enum(['all', 'any']).default('all'),
    conditions: z.array(RuleConditionSchema).min(1, 'Add at least one condition').max(20),
    guidance: z.string().trim().min(1, 'Write the guidance').max(20000),
    showToCustomer: z.boolean().default(false),
    articleIds: z.array(z.string().uuid()).max(30).default([]),
    assetIds: z.array(z.string().uuid()).max(30).default([]),
    active: z.boolean().default(true),
    position: z.number().int().min(0).max(100000).default(0),
})
export type IntakeRuleInput = z.infer<typeof IntakeRuleSchema>
