'use client'

import { useState } from 'react'
import Tabs from '@/components/ui/Tabs'
import PageHeader from '@/components/shared/PageHeader'
import QuestionsTab from './QuestionsTab'
import RulesTab from './RulesTab'
import navigationIcon from '@/configs/icons.config'
import { homePath } from '@/configs/app.config'
import { useIntakeQuestionsStore, useIntakeRulesStore } from '@/stores/IntakeStores'
import { usePageBreadcrumbs } from '@/utils/hooks/useBreadcrumbs'

/** Administration: the discovery questionnaire and the IF/ELSE rules that turn answers into guidance */
export default function IntakeSettingsClientPage() {
    usePageBreadcrumbs([{ label: 'Home', href: homePath }, { label: 'Intake & rules' }])
    const [tab, setTab] = useState('questions')
    const questionCount = useIntakeQuestionsStore((s) => s.data?.length)
    const ruleCount = useIntakeRulesStore((s) => s.data?.length)
    return (
        <>
            <PageHeader
                eyebrow="Administration"
                title="Intake & rules"
                description="The questions every discovery intake asks, and the IF/ELSE rules that turn answers into gotchas and best practices. Rules feed the live panel on each intake and the generated BRDs. Changes are recorded in the audit log."
            />
            <Tabs value={tab} onChange={(value) => setTab(String(value))}>
                <Tabs.TabList className="mb-6">
                    <Tabs.TabNav value="questions" icon={navigationIcon.intake}>
                        Questions{questionCount !== undefined ? ` (${questionCount})` : ''}
                    </Tabs.TabNav>
                    <Tabs.TabNav value="rules" icon={navigationIcon.rules}>
                        IF/ELSE rules{ruleCount !== undefined ? ` (${ruleCount})` : ''}
                    </Tabs.TabNav>
                </Tabs.TabList>
                <Tabs.TabContent value="questions">
                    <QuestionsTab />
                </Tabs.TabContent>
                <Tabs.TabContent value="rules">
                    <RulesTab />
                </Tabs.TabContent>
            </Tabs>
        </>
    )
}
