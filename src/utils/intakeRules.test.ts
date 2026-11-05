import { describe, expect, it } from 'vitest'
import {
    answerValues,
    evaluateCondition,
    evaluateRules,
    formatAnswer,
    groupBySection,
    missingRequired,
    visibleQuestions,
} from './intakeRules'
import type { IntakeRule } from '@/@types/intake/IntakeRule'
import type { IntakeQuestion } from '@/@types/intake/IntakeQuestion'

const rule = (overrides: Partial<IntakeRule>): IntakeRule => ({
    id: 'r1',
    title: 'Rule',
    kind: 'gotcha',
    productId: null,
    match: 'all',
    conditions: [],
    guidance: 'Do the thing',
    showToCustomer: false,
    articleIds: [],
    assetIds: [],
    active: true,
    position: 0,
    ...overrides,
})

const question = (overrides: Partial<IntakeQuestion>): IntakeQuestion => ({
    id: 'q',
    key: 'q',
    section: 'General',
    label: 'Question',
    help: '',
    type: 'text',
    options: [],
    required: false,
    productId: null,
    position: 0,
    active: true,
    ...overrides,
})

describe('answerValues', () => {
    it('normalises strings and lists and drops blanks', () => {
        expect(answerValues(' Yes ')).toEqual(['yes'])
        expect(answerValues(['ERP', '', ' excel'])).toEqual(['erp', 'excel'])
        expect(answerValues(undefined)).toEqual([])
    })
})

describe('evaluateCondition', () => {
    const answers = { on_prem: 'yes', sources: ['erp', 'excel'], users: '250', goal: 'Faster month-end close' }

    it('equals / not_equals compare a single value', () => {
        expect(evaluateCondition({ questionKey: 'on_prem', operator: 'equals', value: 'YES' }, answers)).toBe(true)
        expect(evaluateCondition({ questionKey: 'sources', operator: 'equals', value: 'erp' }, answers)).toBe(false)
        expect(evaluateCondition({ questionKey: 'on_prem', operator: 'not_equals', value: 'no' }, answers)).toBe(true)
    })

    it('includes / not_includes look inside pick-any answers', () => {
        expect(evaluateCondition({ questionKey: 'sources', operator: 'includes', value: 'excel' }, answers)).toBe(true)
        expect(evaluateCondition({ questionKey: 'sources', operator: 'not_includes', value: 'sql' }, answers)).toBe(
            true,
        )
    })

    it('contains matches text', () => {
        expect(evaluateCondition({ questionKey: 'goal', operator: 'contains', value: 'month-end' }, answers)).toBe(true)
        expect(evaluateCondition({ questionKey: 'goal', operator: 'contains', value: '' }, answers)).toBe(false)
    })

    it('answered / not_answered', () => {
        expect(evaluateCondition({ questionKey: 'goal', operator: 'answered', value: '' }, answers)).toBe(true)
        expect(evaluateCondition({ questionKey: 'missing', operator: 'not_answered', value: '' }, answers)).toBe(true)
    })

    it('numeric comparisons ignore non-numbers', () => {
        expect(evaluateCondition({ questionKey: 'users', operator: 'greater_than', value: '100' }, answers)).toBe(true)
        expect(evaluateCondition({ questionKey: 'users', operator: 'less_than', value: '100' }, answers)).toBe(false)
        expect(evaluateCondition({ questionKey: 'goal', operator: 'greater_than', value: '1' }, answers)).toBe(false)
    })
})

describe('evaluateRules', () => {
    const answers = { on_prem: 'yes', licensing: ['none'] }

    it('returns matching active rules in order, honouring all/any', () => {
        const rules = [
            rule({
                id: 'b',
                title: 'B',
                position: 2,
                conditions: [{ questionKey: 'on_prem', operator: 'equals', value: 'yes' }],
            }),
            rule({
                id: 'a',
                title: 'A',
                position: 1,
                match: 'any',
                conditions: [
                    { questionKey: 'licensing', operator: 'includes', value: 'fabric' },
                    { questionKey: 'licensing', operator: 'includes', value: 'none' },
                ],
            }),
            rule({
                id: 'c',
                title: 'C',
                conditions: [
                    { questionKey: 'on_prem', operator: 'equals', value: 'yes' },
                    { questionKey: 'licensing', operator: 'includes', value: 'fabric' },
                ],
            }),
            rule({
                id: 'd',
                title: 'D',
                active: false,
                conditions: [{ questionKey: 'on_prem', operator: 'answered', value: '' }],
            }),
            rule({ id: 'e', title: 'E', conditions: [] }),
        ]
        expect(evaluateRules(rules, answers, []).map((r) => r.id)).toEqual(['a', 'b'])
    })

    it('skips rules for products that are out of scope', () => {
        const scoped = rule({
            productId: 'p1',
            conditions: [{ questionKey: 'on_prem', operator: 'answered', value: '' }],
        })
        expect(evaluateRules([scoped], answers, [])).toHaveLength(0)
        expect(evaluateRules([scoped], answers, ['p1'])).toHaveLength(1)
    })
})

describe('questions', () => {
    const questions = [
        question({ key: 'b', section: 'Data', position: 20, required: true }),
        question({ key: 'a', section: 'Context', position: 10 }),
        question({ key: 'p', section: 'Planning', position: 30, productId: 'acterys' }),
        question({ key: 'x', section: 'Data', position: 40, active: false }),
    ]

    it('shows active questions for the products in scope, grouped by section', () => {
        expect(visibleQuestions(questions, []).map((q) => q.key)).toEqual(['a', 'b'])
        const visible = visibleQuestions(questions, ['acterys'])
        expect(groupBySection(visible).map((g) => g.section)).toEqual(['Context', 'Data', 'Planning'])
    })

    it('lists required questions without an answer', () => {
        expect(missingRequired(questions, { b: ' ' }).map((q) => q.key)).toEqual(['b'])
        expect(missingRequired(questions, { b: 'done' })).toHaveLength(0)
    })

    it('formats answers with option labels', () => {
        const choice = question({
            type: 'multi_choice',
            options: [
                { value: 'erp', label: 'ERP' },
                { value: 'excel', label: 'Excel' },
            ],
        })
        expect(formatAnswer(choice, ['erp', 'excel'])).toBe('ERP, Excel')
        expect(formatAnswer(question({ type: 'yes_no' }), 'yes')).toBe('Yes')
        expect(formatAnswer(question({}), undefined)).toBe('')
    })
})
