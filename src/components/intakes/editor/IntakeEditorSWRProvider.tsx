'use client'

import { useSWRIntakeEditor } from '@/services/intake'
import { useIntakeEditorStore } from '@/stores/IntakeStores'
import useSyncResource from '@/utils/hooks/useSyncResource'
import type { IntakeEditorDetails } from '@/@types/intake/IntakeEditorExtras'
import type { ProviderProps } from '@/@types/common'

interface IntakeEditorSWRProviderProps extends ProviderProps {
    intakeId: string
    /** Server-rendered first load */
    editor?: IntakeEditorDetails
}

/** Intake form data (intake, questions, active rules, products, link titles) → useIntakeEditorStore(intakeId) */
export default function IntakeEditorSWRProvider({ intakeId, editor, children }: IntakeEditorSWRProviderProps) {
    // No refetch on focus: the form is the working copy; the store is refreshed explicitly after saves
    const swr = useSWRIntakeEditor(intakeId, { fallbackData: editor, revalidateOnFocus: false })
    const setData = useIntakeEditorStore(intakeId, (s) => s.setData)
    const setLoading = useIntakeEditorStore(intakeId, (s) => s.setLoading)
    const setError = useIntakeEditorStore(intakeId, (s) => s.setError)
    const setRefresh = useIntakeEditorStore(intakeId, (s) => s.setRefresh)
    useSyncResource(swr, { setData, setLoading, setError, setRefresh })
    return <>{children}</>
}
