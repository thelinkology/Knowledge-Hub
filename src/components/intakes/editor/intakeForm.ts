import { isAnswered } from '@/utils/intakeRules'
import type { Answer, Answers, Intake, SaveIntakeInput } from '@/@types/intake/Intake'
import type { IntakeQuestion } from '@/@types/intake/IntakeQuestion'
import type { IntakeFormData } from '@/@types/intake/forms/IntakeFormData'

/** Element ids of the fields (the "missing answers" list jumps to them) */
export const INTAKE_FIELD_IDS = { title: 'intake-title', status: 'intake-status', products: 'intake-products' } as const

export const questionFieldId = (key: string) => `intake-q-${key}`

/**
 * Every question gets an entry ('' or [] when unanswered), so registering a field never changes the
 * form's values and "unsaved changes" only reflects real edits.
 */
export const toFormData = (intake: Intake, questions: IntakeQuestion[]): IntakeFormData => ({
    title: intake.title,
    status: intake.status,
    productIds: intake.productIds,
    answers: {
        ...Object.fromEntries(questions.map((q) => [q.key, q.type === 'multi_choice' ? [] : ''])),
        ...intake.answers,
    },
    notes: intake.notes,
})

/** The form's answers that have a value (blanks dropped) */
export const formAnswers = (answers: IntakeFormData['answers'] | undefined): Answers =>
    Object.fromEntries(Object.entries(answers ?? {}).filter((entry): entry is [string, Answer] => isAnswered(entry[1])))

export const toSaveInput = (values: IntakeFormData): SaveIntakeInput => ({
    title: values.title.trim(),
    status: values.status,
    productIds: values.productIds,
    answers: formAnswers(values.answers),
    notes: values.notes,
})

/** Scrolls to a question and puts the keyboard in it (the first option of a radio/checkbox group) */
export function focusQuestion(key: string) {
    const element = document.getElementById(questionFieldId(key))
    if (!element) return
    const target =
        element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement
            ? element
            : element.querySelector<HTMLElement>('input:not([type=hidden]), textarea, button')
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    target?.focus({ preventScroll: true })
}
