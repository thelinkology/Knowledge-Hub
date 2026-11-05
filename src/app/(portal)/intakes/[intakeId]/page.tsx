import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import IntakeEditorSWRProvider from '@/components/intakes/editor/IntakeEditorSWRProvider'
import IntakeEditorClientPage from '@/components/intakes/editor/IntakeEditorClientPage'
import { getIntakeEditor } from '@/server/actions/intake'
import { requirePagePermission } from '@/server/actions/auth'
import { isNotFound } from '@/server/utils/errors'
import { isUuid } from '@/utils/ids'

export const metadata: Metadata = { title: 'Discovery intake' }

interface IntakePageProps {
    params: Promise<{ intakeId: string }>
}

export default async function IntakePage({ params }: IntakePageProps) {
    await requirePagePermission('requirements.manage')
    const { intakeId } = await params
    if (!isUuid(intakeId)) notFound()

    let editor
    try {
        editor = await getIntakeEditor(intakeId)
    } catch (error) {
        if (isNotFound(error)) notFound()
        throw error
    }

    return (
        <IntakeEditorSWRProvider intakeId={intakeId} editor={editor}>
            <IntakeEditorClientPage intakeId={intakeId} />
        </IntakeEditorSWRProvider>
    )
}
