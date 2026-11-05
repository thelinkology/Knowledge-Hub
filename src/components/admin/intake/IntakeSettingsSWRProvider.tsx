'use client'

import { useSWRIntakeQuestions, useSWRIntakeRules } from '@/services/intake'
import { useIntakeQuestionsStore, useIntakeRulesStore } from '@/stores/IntakeStores'
import useSyncResource from '@/utils/hooks/useSyncResource'
import type { IntakeQuestion } from '@/@types/intake/IntakeQuestion'
import type { IntakeRule } from '@/@types/intake/IntakeRule'
import type { ProviderProps } from '@/@types/common'

interface IntakeSettingsSWRProviderProps extends ProviderProps {
    /** Server-rendered first load */
    questions?: IntakeQuestion[]
    rules?: IntakeRule[]
}

/** Intake questions → useIntakeQuestionsStore; IF/ELSE rules → useIntakeRulesStore */
export default function IntakeSettingsSWRProvider({ questions, rules, children }: IntakeSettingsSWRProviderProps) {
    const questionsSwr = useSWRIntakeQuestions({ fallbackData: questions })
    const rulesSwr = useSWRIntakeRules({ fallbackData: rules })
    useSyncResource(questionsSwr, {
        setData: useIntakeQuestionsStore((s) => s.setData),
        setLoading: useIntakeQuestionsStore((s) => s.setLoading),
        setError: useIntakeQuestionsStore((s) => s.setError),
        setRefresh: useIntakeQuestionsStore((s) => s.setRefresh),
    })
    useSyncResource(rulesSwr, {
        setData: useIntakeRulesStore((s) => s.setData),
        setLoading: useIntakeRulesStore((s) => s.setLoading),
        setError: useIntakeRulesStore((s) => s.setError),
        setRefresh: useIntakeRulesStore((s) => s.setRefresh),
    })
    return <>{children}</>
}
