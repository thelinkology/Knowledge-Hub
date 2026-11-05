import {
    VALUELESS_OPERATORS,
    ruleOperatorLabel,
    type IntakeRule,
    type RuleCondition,
    type RuleOperator,
} from '@/@types/intake/IntakeRule'
import { isChoiceType, type IntakeQuestion, type QuestionType } from '@/@types/intake/IntakeQuestion'
import type { Answer, Answers } from '@/@types/intake/Intake'

/*
 * Helpers for configuring intake questions and IF/ELSE rules, and for keeping stored answers tidy.
 * Pure, shared by the admin screens, the intake form and the server (which validates again).
 */

type QuestionRef = Pick<IntakeQuestion, 'key' | 'label' | 'type' | 'options'>

/** The operators that make sense for a question type, in the order the rule editor offers them */
export function operatorsFor(type: QuestionType): RuleOperator[] {
    switch (type) {
        case 'multi_choice':
            return ['includes', 'not_includes', 'equals', 'not_equals', 'answered', 'not_answered']
        case 'single_choice':
        case 'yes_no':
            return ['equals', 'not_equals', 'answered', 'not_answered']
        case 'number':
            return ['greater_than', 'less_than', 'equals', 'not_equals', 'answered', 'not_answered']
        default:
            return ['contains', 'equals', 'not_equals', 'answered', 'not_answered']
    }
}

export const isValuelessOperator = (operator: RuleOperator) => VALUELESS_OPERATORS.includes(operator)

const YES_NO_OPTIONS = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
]

/** The values a condition can compare with: the options of a choice / yes-no question, null for free input */
export function conditionValueOptions(
    question: Pick<IntakeQuestion, 'type' | 'options'>,
): { value: string; label: string }[] | null {
    if (question.type === 'yes_no') return YES_NO_OPTIONS
    if (isChoiceType(question.type)) return question.options
    return null
}

const isNumeric = (value: string) => {
    const trimmed = value.trim().replace(/,/g, '')
    return !!trimmed && Number.isFinite(Number(trimmed))
}

/**
 * What's wrong with a rule's conditions, as readable messages (empty when they're fine): unknown
 * questions, missing values, values that aren't one of the question's options, non-numeric limits.
 */
export function conditionIssues(conditions: RuleCondition[], questions: QuestionRef[]): string[] {
    const issues: string[] = []
    conditions.forEach((condition, index) => {
        const n = `Condition ${index + 1}`
        const question = questions.find((q) => q.key === condition.questionKey)
        if (!question) {
            issues.push(`${n}: no question has the key “${condition.questionKey}”.`)
            return
        }
        if (isValuelessOperator(condition.operator)) return
        const value = condition.value.trim()
        if (!value) {
            issues.push(`${n}: choose or type the value to compare with.`)
            return
        }
        const options = conditionValueOptions(question)
        if (options && condition.operator !== 'contains' && !options.some((o) => o.value === value)) {
            issues.push(`${n}: “${value}” isn’t one of the options of “${question.label}”.`)
        }
        if ((condition.operator === 'greater_than' || condition.operator === 'less_than') && !isNumeric(value)) {
            issues.push(`${n}: “${ruleOperatorLabel[condition.operator]}” needs a number.`)
        }
    })
    return issues
}

/** One condition as text: “Is any source data on-premises?” is “Yes” */
export function describeCondition(condition: RuleCondition, questions: QuestionRef[]): string {
    const question = questions.find((q) => q.key === condition.questionKey)
    const subject = `“${question?.label ?? condition.questionKey}”`
    const operator = ruleOperatorLabel[condition.operator]
    if (isValuelessOperator(condition.operator)) return `${subject} ${operator}`
    const options = question ? conditionValueOptions(question) : null
    const value = options?.find((o) => o.value === condition.value)?.label ?? condition.value
    return `${subject} ${operator} “${value}”`
}

/** A rule's conditions as one sentence: IF a AND b (or IF a OR b) */
export function describeConditions(rule: Pick<IntakeRule, 'conditions' | 'match'>, questions: QuestionRef[]): string {
    if (!rule.conditions.length) return 'No conditions (never applies)'
    const joiner = rule.match === 'any' ? ' OR ' : ' AND '
    return `IF ${rule.conditions.map((c) => describeCondition(c, questions)).join(joiner)}`
}

function normaliseAnswer(question: Pick<IntakeQuestion, 'type' | 'options'>, answer: Answer): Answer | null {
    const values = (Array.isArray(answer) ? answer : [answer]).map((v) => v.trim()).filter(Boolean)
    if (!values.length) return null
    switch (question.type) {
        case 'multi_choice': {
            const allowed = new Set(question.options.map((o) => o.value))
            const picked = [...new Set(values.filter((v) => allowed.has(v)))]
            return picked.length ? picked : null
        }
        case 'single_choice':
            return question.options.some((o) => o.value === values[0]) ? values[0] : null
        case 'yes_no': {
            const value = values[0].toLowerCase()
            return value === 'yes' || value === 'no' ? value : null
        }
        case 'number':
            return isNumeric(values[0]) ? values[0] : null
        default:
            return Array.isArray(answer) ? values.join(', ') : answer.trim()
    }
}

/**
 * Answers as they are stored: only keys of existing questions, blanks dropped, and each answer in the
 * shape its question expects (choice values that are still options, yes/no, numbers).
 */
export function normaliseAnswers(questions: Pick<IntakeQuestion, 'key' | 'type' | 'options'>[], answers: Answers) {
    const byKey = new Map(questions.map((q) => [q.key, q]))
    const result: Answers = {}
    for (const [key, answer] of Object.entries(answers)) {
        const question = byKey.get(key)
        if (!question) continue
        const value = normaliseAnswer(question, answer)
        if (value !== null) result[key] = value
    }
    return result
}

/** The next free position after the given items (steps of 10, so items can be slotted in between) */
export const nextPosition = (items: { position: number }[]) =>
    items.reduce((max, item) => Math.max(max, item.position), 0) + 10

/** A question key suggested from its wording: "Is any data on-premises?" → is_any_data_on_premises */
export const toQuestionKey = (label: string) =>
    label
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^[^a-z]+/, '')
        .slice(0, 60)
        .replace(/_+$/, '')
