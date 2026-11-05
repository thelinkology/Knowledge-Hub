'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import LinkButton from '@/components/ui/LinkButton'
import Segment from '@/components/ui/Segment'
import Select from '@/components/ui/Select'
import PageHeader from '@/components/shared/PageHeader'
import BrdList from './BrdList'
import { ForwardIcon } from '@/configs/icons.config'
import { homePath, intakesPath } from '@/configs/app.config'
import { useSWRClients } from '@/services/clients'
import { usePageBreadcrumbs } from '@/utils/hooks/useBreadcrumbs'
import { brdAudienceLabel } from '@/@types/brds/Brd'
import { AUDIENCES, type Audience } from '@/@types/shared/PublishStatusOptions'

const AUDIENCE_FILTERS: { value: Audience | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    ...AUDIENCES.map((audience) => ({ value: audience, label: brdAudienceLabel[audience] })),
]

/** Every BRD, filterable by client and by document (customer BRD / internal delivery brief) */
export default function BrdsClientPage() {
    usePageBreadcrumbs([{ label: 'Home', href: homePath }, { label: 'BRDs' }])
    const [clientId, setClientId] = useState('')
    const [audience, setAudience] = useState<Audience | null>(null)
    const { data: clients } = useSWRClients()

    const clientOptions = [
        { value: '', label: 'All clients' },
        ...(clients ?? []).map((c) => ({ value: c.id, label: c.name })),
    ]
    const toIntakes = (
        <LinkButton size="sm" href={intakesPath} icon={<ForwardIcon />} iconAlignment="end">
            Go to discovery intakes
        </LinkButton>
    )

    return (
        <>
            <PageHeader
                eyebrow="Requirements"
                title="BRDs"
                description="Customer-facing business requirements and internal delivery briefs, generated from discovery intakes and refined by the team."
                actions={toIntakes}
            />
            <Card bodyClass="p-0">
                <div className="flex flex-col gap-3 border-b border-gray-200 p-4 md:flex-row md:items-center md:justify-between dark:border-gray-700">
                    <div className="w-full md:w-72">
                        <label htmlFor="brd-client-filter" className="sr-only">
                            Filter by client
                        </label>
                        <Select
                            inputId="brd-client-filter"
                            size="sm"
                            options={clientOptions}
                            value={clientOptions.find((o) => o.value === clientId) ?? clientOptions[0]}
                            onChange={(option) => setClientId(option?.value ?? '')}
                        />
                    </div>
                    <Segment
                        size="sm"
                        value={audience ?? 'all'}
                        onChange={(value) => {
                            if (typeof value !== 'string' || !value) return // clicking the active filter keeps it
                            setAudience(value === 'all' ? null : (value as Audience))
                        }}
                        aria-label="Filter by document"
                        className="self-start md:self-auto"
                    >
                        {AUDIENCE_FILTERS.map((filter) => (
                            <Segment.Item key={filter.value} value={filter.value} type="button">
                                {filter.label}
                            </Segment.Item>
                        ))}
                    </Segment>
                </div>
                <BrdList
                    clientId={clientId || undefined}
                    audience={audience ?? undefined}
                    emptyAction={!clientId && !audience ? toIntakes : undefined}
                />
            </Card>
        </>
    )
}
