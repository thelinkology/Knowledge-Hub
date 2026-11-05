import type { Metadata } from 'next'
import IntakeSettingsSWRProvider from '@/components/admin/intake/IntakeSettingsSWRProvider'
import IntakeSettingsClientPage from '@/components/admin/intake/IntakeSettingsClientPage'
import { ProductsSWRProvider } from '@/components/knowledge/reader/ArticleSWRProvider'
import { getIntakeQuestions, getIntakeRules } from '@/server/actions/intake'
import { requirePagePermission } from '@/server/actions/auth'

export const metadata: Metadata = { title: 'Intake & rules' }

export default async function IntakeSettingsPage() {
    await requirePagePermission('settings.manage')
    const [questions, rules] = await Promise.all([getIntakeQuestions(), getIntakeRules()])
    return (
        <ProductsSWRProvider>
            <IntakeSettingsSWRProvider questions={questions} rules={rules}>
                <IntakeSettingsClientPage />
            </IntakeSettingsSWRProvider>
        </ProductsSWRProvider>
    )
}
