'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import PageHeader from '@/components/shared/PageHeader'
import IntakeList from './IntakeList'
import NewIntakeDialog from './NewIntakeDialog'
import { AddIcon } from '@/configs/icons.config'
import { homePath } from '@/configs/app.config'
import { usePageBreadcrumbs } from '@/utils/hooks/useBreadcrumbs'
import type { IntakeSummary } from '@/@types/intake/Intake'

/** Every discovery intake, with filters and "New discovery intake" */
export default function IntakesClientPage({ initialData }: { initialData?: IntakeSummary[] }) {
    usePageBreadcrumbs([{ label: 'Home', href: homePath }, { label: 'Discovery intakes' }])
    const [creating, setCreating] = useState(false)
    return (
        <>
            <PageHeader
                eyebrow="Requirements"
                title="Discovery intakes"
                description="Capture requirements with a guided questionnaire. Answers surface gotchas and best practices as you go, then generate the customer BRD and the internal delivery brief."
                actions={
                    <Button variant="solid" size="sm" icon={<AddIcon />} onClick={() => setCreating(true)}>
                        New discovery intake
                    </Button>
                }
            />
            <Card bodyClass="p-0">
                <IntakeList initialData={initialData} onCreate={() => setCreating(true)} />
            </Card>
            {creating && <NewIntakeDialog onClose={() => setCreating(false)} />}
        </>
    )
}
