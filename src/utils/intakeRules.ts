import type { IntakeRule, RuleCondition } from '@/@types/intake/IntakeRule'
import type { IntakeQuestion } from '@/@types/intake/IntakeQuestion'
import type { Answer, Answers } from '@/@types/intake/Intake'

/*
 * The IF/ELSE engine behind discovery intakes. Pure, shared by the intake form (live "gotchas & best
 * practices" panel) and the server (BRD generation), so both always agree.
 */

/** An answer as a list of normalised values ('' and blanks dropped) */
export function answerValues(answer: Answer | undefined): string[] {
    if (answer === undefined) return []
    const list = Array.isArray(answer) ? answer : [answer]
    return list.map((v) => v.trim().toLowerCase()).filter(Boolean)
}

export const isAnswered = (answer: Answer | undefined) => answerValues(answer).length > 0

const toNumber = (value: string) => {
    const n = Number(value.replace(/,/g, ''))
    return Number.isFinite(n) ? n : null
}

/** One condition against the answers */
export function evaluateCondition(condition: RuleCondition, answers: Answers): boolean {
    const values = answerValues(answers[condition.questionKey])
    const target = condition.value.trim().toLowerCase()
    switch (condition.operator) {
        case 'answered':
            return values.length > 0
        case 'not_answered':
            return values.length === 0
        case 'equals':
            // A pick-any answer "equals" when it is exactly that one value
            return values.length === 1 && values[0] === target
        case 'not_equals':
            return !(values.length === 1 && values[0] === target)
        case 'includes':
            return values.includes(target)
        case 'not_includes':
            return !values.includes(target)
        case 'contains':
            return !!target && values.some((v) => v.includes(target))
        case 'greater_than':
        case 'less_than': {
            const limit = toNumber(target)
            const actual = values.length === 1 ? toNumber(values[0]) : null
            if (limit === null || actual === null) return false
            return condition.operator === 'greater_than' ? actual > limit : actual < limit
        }
    }
}

/** A rule applies to the intake's scope when it has no product or its product is in scope */
export const ruleInScope = (rule: Pick<IntakeRule, 'productId'>, productIds: string[]) =>
    !rule.productId || productIds.includes(rule.productId)

/** Whether one rule's conditions match (all / any). A rule with no conditions never matches. */
export function ruleMatches(rule: Pick<IntakeRule, 'conditions' | 'match'>, answers: Answers): boolean {
    if (!rule.conditions.length) return false
    return rule.match === 'any'
        ? rule.conditions.some((c) => evaluateCondition(c, answers))
        : rule.conditions.every((c) => evaluateCondition(c, answers))
}

/** The active, in-scope rules whose conditions match, in their configured order */
export function evaluateRules(rules: IntakeRule[], answers: Answers, productIds: string[]): IntakeRule[] {
    return rules
        .filter((rule) => rule.active && ruleInScope(rule, productIds) && ruleMatches(rule, answers))
        .sort((a, b) => a.position - b.position || a.title.localeCompare(b.title))
}

/** The active questions to ask for the products in scope, ordered by section order then position */
export function visibleQuestions(questions: IntakeQuestion[], productIds: string[]): IntakeQuestion[] {
    return questions
        .filter((q) => q.active && (!q.productId || productIds.includes(q.productId)))
        .sort((a, b) => a.position - b.position || a.label.localeCompare(b.label))
}

/** Questions grouped by section, sections in the order their first question appears */
export function groupBySection(questions: IntakeQuestion[]): { section: string; questions: IntakeQuestion[] }[] {
    const groups: { section: string; questions: IntakeQuestion[] }[] = []
    for (const question of questions) {
        const group = groups.find((g) => g.section === question.section)
        if (group) group.questions.push(question)
        else groups.push({ section: question.section, questions: [question] })
    }
    return groups
}

/** Required visible questions that have no answer yet */
export function missingRequired(questions: IntakeQuestion[], answers: Answers): IntakeQuestion[] {
    return questions.filter((q) => q.required && !isAnswered(answers[q.key]))
}

/** Answers limited to the visible questions (answers to hidden questions are kept in storage but not used) */
export function answersInScope(questions: IntakeQuestion[], answers: Answers): Answers {
    const keys = new Set(questions.map((q) => q.key))
    return Object.fromEntries(Object.entries(answers).filter(([key]) => keys.has(key)))
}

/** An answer as readable text, using the question's option labels ("Yes"/"No" for yes-no) */
export function formatAnswer(question: Pick<IntakeQuestion, 'type' | 'options'>, answer: Answer | undefined): string {
    const values = Array.isArray(answer) ? answer : answer ? [answer] : []
    const cleaned = values.map((v) => v.trim()).filter(Boolean)
    if (!cleaned.length) return ''
    if (question.type === 'yes_no') return cleaned[0].toLowerCase() === 'yes' ? 'Yes' : 'No'
    if (question.type === 'single_choice' || question.type === 'multi_choice') {
        return cleaned.map((v) => question.options.find((o) => o.value === v)?.label ?? v).join(', ')
    }
    return cleaned.join(', ')
}
