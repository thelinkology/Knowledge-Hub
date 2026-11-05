import useSWR, { type SWRConfiguration } from 'swr'
import api from '@/services/api'
import { tryParseDate } from '@/utils/parse'
import type { Intake, IntakesQuery, IntakeSummary, NewIntakeInput, SaveIntakeInput } from '@/@types/intake/Intake'
import type { IntakeEditorDetails, LinkedItem } from '@/@types/intake/IntakeEditorExtras'
import type { IntakeQuestion, IntakeQuestionInput } from '@/@types/intake/IntakeQuestion'
import type { IntakeRule, IntakeRuleInput } from '@/@types/intake/IntakeRule'

// ── Date revivers (JSON has strings) ──

export const ensureIntakeSummary = <T extends IntakeSummary>(i: T): T => ({
    ...i,
    updatedAt: tryParseDate(i.updatedAt) as Date,
})

export const ensureIntake = (i: Intake): Intake => ({
    ...ensureIntakeSummary(i),
    createdAt: tryParseDate(i.createdAt) as Date,
})

const ensureEditor = (data: IntakeEditorDetails): IntakeEditorDetails => ({
    ...data,
    intake: ensureIntake(data.intake),
})

// ── Intakes ──

export const getIntakesUrl = ({ clientId, status }: Partial<IntakesQuery> = {}) => {
    const params = new URLSearchParams()
    if (clientId) params.set('clientId', clientId)
    if (status) params.set('status', status)
    const s = params.toString()
    return s ? `/intakes?${s}` : '/intakes'
}

export const apiGetIntakes = async (query: Partial<IntakesQuery> = {}) =>
    (await api.fetchJson<IntakeSummary[]>({ method: 'get', url: getIntakesUrl(query) })).map(ensureIntakeSummary)

export const useSWRIntakes = (query: Partial<IntakesQuery> | null, config?: SWRConfiguration<IntakeSummary[]>) =>
    useSWR(query ? getIntakesUrl(query) : null, () => apiGetIntakes(query!), { keepPreviousData: true, ...config })

export const apiCreateIntake = async (input: NewIntakeInput) =>
    ensureIntake(await api.fetchJson<Intake>({ method: 'post', url: '/intakes', data: input }))

export const getIntakeUrl = (intakeId: string) => `/intakes/${intakeId}`

export const apiGetIntakeEditor = async (intakeId: string) =>
    ensureEditor(await api.fetchJson<IntakeEditorDetails>({ method: 'get', url: getIntakeUrl(intakeId) }))

export const useSWRIntakeEditor = (intakeId: string | null, config?: SWRConfiguration<IntakeEditorDetails>) =>
    useSWR(intakeId ? getIntakeUrl(intakeId) : null, () => apiGetIntakeEditor(intakeId!), {
        // The form owns its state; don't reload it underneath the author
        revalidateOnFocus: false,
        ...config,
    })

export const apiSaveIntake = async (intakeId: string, input: SaveIntakeInput) =>
    ensureEditor(await api.fetchJson<IntakeEditorDetails>({ method: 'put', url: getIntakeUrl(intakeId), data: input }))

export const apiDeleteIntake = (intakeId: string) =>
    api.fetchJson<void>({ method: 'delete', url: getIntakeUrl(intakeId) })

// ── Questions (admin settings) ──

export const intakeQuestionsUrl = '/admin/intake/questions'

export const apiGetIntakeQuestions = () => api.fetchJson<IntakeQuestion[]>({ method: 'get', url: intakeQuestionsUrl })

export const useSWRIntakeQuestions = (config?: SWRConfiguration<IntakeQuestion[]>) =>
    useSWR(intakeQuestionsUrl, apiGetIntakeQuestions, config)

export const apiCreateIntakeQuestion = (input: IntakeQuestionInput) =>
    api.fetchJson<IntakeQuestion>({ method: 'post', url: intakeQuestionsUrl, data: input })

export const apiUpdateIntakeQuestion = (questionId: string, input: IntakeQuestionInput) =>
    api.fetchJson<IntakeQuestion>({ method: 'put', url: `${intakeQuestionsUrl}/${questionId}`, data: input })

export const apiDeleteIntakeQuestion = (questionId: string) =>
    api.fetchJson<void>({ method: 'delete', url: `${intakeQuestionsUrl}/${questionId}` })

// ── IF/ELSE rules (admin settings) ──

export const intakeRulesUrl = '/admin/intake/rules'

export const apiGetIntakeRules = () => api.fetchJson<IntakeRule[]>({ method: 'get', url: intakeRulesUrl })

export const useSWRIntakeRules = (config?: SWRConfiguration<IntakeRule[]>) =>
    useSWR(intakeRulesUrl, apiGetIntakeRules, config)

export const apiCreateIntakeRule = (input: IntakeRuleInput) =>
    api.fetchJson<IntakeRule>({ method: 'post', url: intakeRulesUrl, data: input })

export const apiUpdateIntakeRule = (ruleId: string, input: IntakeRuleInput) =>
    api.fetchJson<IntakeRule>({ method: 'put', url: `${intakeRulesUrl}/${ruleId}`, data: input })

export const apiDeleteIntakeRule = (ruleId: string) =>
    api.fetchJson<void>({ method: 'delete', url: `${intakeRulesUrl}/${ruleId}` })

// ── Library assets for the rule links picker ──

const assetOptionsUrl = '/assets'

/** Library assets by title (for linking from rules) */
export const apiGetAssetOptions = async (): Promise<LinkedItem[]> =>
    (await api.fetchJson<LinkedItem[]>({ method: 'get', url: assetOptionsUrl })).map(({ id, title }) => ({ id, title }))

export const useSWRAssetOptions = (enabled: boolean, config?: SWRConfiguration<LinkedItem[]>) =>
    useSWR(enabled ? `${assetOptionsUrl}#options` : null, apiGetAssetOptions, { shouldRetryOnError: false, ...config })
