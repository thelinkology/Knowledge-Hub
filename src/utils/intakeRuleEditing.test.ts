import { describe, expect, it } from 'vitest'
import {
    conditionIssues,
    conditionValueOptions,
    describeCondition,
    describeConditions,
    nextPosition,
    normaliseAnswers,
    operatorsFor,
    toQuestionKey,
} from './intakeRuleEditing'
import type { IntakeQuestion } from '@/@types/intake/IntakeQuestion'

const question = (overrides: Partial<IntakeQuestion>): IntakeQuestion => ({
    id: 'q',
    key: 'q',
    section: 'Section',
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

const questions = [
    question({ key: 'on_prem', label: 'On-premises data?', type: 'yes_no' }),
    question({
        key: 'sources',
        label: 'Sources',
        type: 'multi_choice',
        options: [
            { value: 'erp', label: 'ERP' },
            { value: 'excel', label: 'Excel' },
        ],
    }),
    question({
        key: 'volume',
        label: 'Volume',
        type: 'single_choice',
        options: [
            { value: 'small', label: 'Small' },
            { value: 'large', label: 'Large' },
        ],
    }),
    question({ key: 'users', label: 'Users', type: 'number' }),
    question({ key: 'goal', label: 'Goal', type: 'long_text' }),
]

describe('operatorsFor', () => {
    it('offers list operators for pick-any questions and comparisons for numbers', () => {
        expect(operatorsFor('multi_choice')).toContain('includes')
        expect(operatorsFor('number')).toContain('greater_than')
        expect(operatorsFor('text')).toContain('contains')
        expect(operatorsFor('yes_no')).not.toContain('includes')
    })
})

describe('conditionValueOptions', () => {
    it('gives yes/no, the question options, or null for free input', () => {
        expect(conditionValueOptions(questions[0])?.map((o) => o.value)).toEqual(['yes', 'no'])
        expect(conditionValueOptions(questions[1])?.map((o) => o.value)).toEqual(['erp', 'excel'])
        expect(conditionValueOptions(questions[3])).toBeNull()
    })
})

describe('conditionIssues', () => {
    it('accepts valid conditions', () => {
        expect(
            conditionIssues(
                [
                    { questionKey: 'on_prem', operator: 'equals', value: 'yes' },
                    { questionKey: 'sources', operator: 'includes', value: 'erp' },
                    { questionKey: 'users', operator: 'greater_than', value: '1,000' },
                    { questionKey: 'goal', operator: 'answered', value: '' },
                    { questionKey: 'goal', operator: 'contains', value: 'budget' },
                ],
                questions,
            ),
        ).toEqual([])
    })

    it('reports unknown questions, missing values, unknown options and non-numbers', () => {
        const issues = conditionIssues(
            [
                { questionKey: 'nope', operator: 'equals', value: 'x' },
                { questionKey: 'goal', operator: 'contains', value: ' ' },
                { questionKey: 'volume', operator: 'equals', value: 'huge' },
                { questionKey: 'users', operator: 'less_than', value: 'many' },
            ],
            questions,
        )
        expect(issues).toHaveLength(4)
        expect(issues[0]).toMatch(/^Condition 1: no question/)
        expect(issues[1]).toMatch(/^Condition 2: choose or type/)
        expect(issues[2]).toMatch(/^Condition 3: “huge” isn’t one of the options/)
        expect(issues[3]).toMatch(/^Condition 4: .* needs a number/)
    })
})

describe('describeConditions', () => {
    it('uses question and option labels', () => {
        expect(describeCondition({ questionKey: 'on_prem', operator: 'equals', value: 'yes' }, questions)).toBe(
            '“On-premises data?” is “Yes”',
        )
        expect(describeCondition({ questionKey: 'goal', operator: 'not_answered', value: '' }, questions)).toBe(
            '“Goal” is not answered',
        )
        expect(describeCondition({ questionKey: 'gone', operator: 'equals', value: 'x' }, questions)).toBe(
            '“gone” is “x”',
        )
    })

    it('joins with AND / OR', () => {
        const conditions = [
            { questionKey: 'on_prem', operator: 'equals' as const, value: 'yes' },
            { questionKey: 'sources', operator: 'includes' as const, value: 'excel' },
        ]
        expect(describeConditions({ match: 'all', conditions }, questions)).toBe(
            'IF “On-premises data?” is “Yes” AND “Sources” includes “Excel”',
        )
        expect(describeConditions({ match: 'any', conditions }, questions)).toContain(' OR ')
        expect(describeConditions({ match: 'all', conditions: [] }, questions)).toMatch(/never applies/)
    })
})

describe('normaliseAnswers', () => {
    it('keeps known keys in the shape their question expects', () => {
        expect(
            normaliseAnswers(questions, {
                on_prem: 'Yes',
                sources: ['erp', 'erp', 'gone', ' '],
                volume: 'huge',
                users: ' 1,200 ',
                goal: '  Faster close  ',
                unknown: 'dropped',
            }),
        ).toEqual({ on_prem: 'yes', sources: ['erp'], users: '1,200', goal: 'Faster close' })
    })

    it('drops blanks and invalid values', () => {
        expect(normaliseAnswers(questions, { goal: '   ', sources: [], users: 'lots', on_prem: 'maybe' })).toEqual({})
    })
})

describe('nextPosition', () => {
    it('steps past the largest position', () => {
        expect(nextPosition([])).toBe(10)
        expect(nextPosition([{ position: 40 }, { position: 120 }])).toBe(130)
    })
})

describe('toQuestionKey', () => {
    it('makes a valid key from the wording', () => {
        expect(toQuestionKey('Is any source data on-premises?')).toBe('is_any_source_data_on_premises')
        expect(toQuestionKey('2026 budget: café owners')).toBe('budget_cafe_owners')
        expect(toQuestionKey('a'.repeat(80))).toHaveLength(60)
        expect(toQuestionKey('???')).toBe('')
    })
})
