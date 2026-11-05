'use client'

import { useState } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Segment from '@/components/ui/Segment'
import Table from '@/components/ui/Table'
import Tag from '@/components/ui/Tag'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import Loading from '@/components/shared/Loading'
import { ProductTags } from '@/components/shared/KnowledgeTags'
import navigationIcon, { AddIcon } from '@/configs/icons.config'
import { getClientPath, getIntakePath } from '@/configs/app.config'
import { useSWRIntakes } from '@/services/intake'
import { useSWRClients } from '@/services/clients'
import { useProductsStore } from '@/stores/AppStores'
import { tryGetErrorMessage } from '@/utils/errors'
import { formatDate, fromNow } from '@/utils/dates'
import classNames from '@/utils/classNames'
import {
    INTAKE_STATUSES,
    intakeStatusLabel,
    intakeStatusTagClass,
    type IntakeStatus,
    type IntakeSummary,
} from '@/@types/intake/Intake'

const { THead, TBody, Tr, Th, Td } = Table

const STATUS_FILTERS: { value: IntakeStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    ...INTAKE_STATUSES.map((status) => ({ value: status, label: intakeStatusLabel[status] })),
]

export function IntakeStatusTag({ status, className }: { status: IntakeStatus; className?: string }) {
    return <Tag className={classNames(intakeStatusTagClass[status], className)}>{intakeStatusLabel[status]}</Tag>
}

interface IntakeListProps {
    /** Only this client's intakes (no client filter or column) */
    clientId?: string
    /** Server-rendered first load of the unfiltered list */
    initialData?: IntakeSummary[]
    /** Offered in the empty state */
    onCreate?: () => void
}

/** Discovery intakes, filterable by client and status (a page-local list: reads SWR directly) */
export default function IntakeList({ clientId, initialData, onCreate }: IntakeListProps) {
    const [clientFilter, setClientFilter] = useState('')
    const [status, setStatus] = useState<IntakeStatus | null>(null)
    const scopedClient = clientId ?? (clientFilter || undefined)
    const unfiltered = !clientFilter && !status
    const { data, error, isLoading, isValidating, mutate } = useSWRIntakes(
        { clientId: scopedClient, status: status ?? undefined },
        { fallbackData: unfiltered && !clientId ? initialData : undefined },
    )
    const { data: clients } = useSWRClients({}, { isPaused: () => !!clientId })
    const products = useProductsStore((s) => s.data)

    const clientOptions = [
        { value: '', label: 'All clients' },
        ...(clients ?? []).map((c) => ({ value: c.id, label: c.name })),
    ]
    const intakes = data ?? []

    return (
        <>
            <div className="flex flex-col gap-3 border-b border-gray-200 p-4 md:flex-row md:items-center md:justify-between dark:border-gray-700">
                {!clientId ? (
                    <div className="w-full md:w-72">
                        <label htmlFor="intake-client-filter" className="sr-only">
                            Filter by client
                        </label>
                        <Select
                            inputId="intake-client-filter"
                            size="sm"
                            options={clientOptions}
                            value={clientOptions.find((o) => o.value === clientFilter) ?? clientOptions[0]}
                            onChange={(option) => setClientFilter(option?.value ?? '')}
                        />
                    </div>
                ) : (
                    <span className="text-sm text-gray-500">
                        {data ? `${intakes.length} intake${intakes.length === 1 ? '' : 's'}` : ' '}
                    </span>
                )}
                <Segment
                    size="sm"
                    value={status ?? 'all'}
                    onChange={(value) => {
                        if (typeof value !== 'string' || !value) return // clicking the active filter keeps it
                        setStatus(value === 'all' ? null : (value as IntakeStatus))
                    }}
                    aria-label="Filter by status"
                    className="self-start md:self-auto"
                >
                    {STATUS_FILTERS.map((filter) => (
                        <Segment.Item key={filter.value} value={filter.value} type="button">
                            {filter.label}
                        </Segment.Item>
                    ))}
                </Segment>
            </div>

            {error && !data ? (
                <ErrorState
                    title="Couldn’t load the intakes"
                    message={tryGetErrorMessage(error)}
                    onRetry={() => void mutate()}
                />
            ) : (
                <Loading loading={isLoading && !data} message="Loading intakes…">
                    {intakes.length === 0 ? (
                        <EmptyState
                            icon={navigationIcon.intake}
                            title={unfiltered ? 'No discovery intakes yet' : 'No intakes match'}
                            description={
                                unfiltered
                                    ? 'An intake captures what you learn in discovery. Its answers surface gotchas and best practices, and generate the customer BRD and the internal delivery brief.'
                                    : 'Try another client or status, or clear the filters.'
                            }
                            action={
                                unfiltered ? (
                                    onCreate && (
                                        <Button size="sm" variant="solid" icon={<AddIcon />} onClick={onCreate}>
                                            New discovery intake
                                        </Button>
                                    )
                                ) : (
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            setClientFilter('')
                                            setStatus(null)
                                        }}
                                    >
                                        Clear filters
                                    </Button>
                                )
                            }
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <Table hoverable className={isValidating ? 'opacity-70 transition-opacity' : undefined}>
                                <THead>
                                    <Tr>
                                        <Th>Intake</Th>
                                        <Th>Status</Th>
                                        <Th>Products</Th>
                                        <Th className="text-right">BRDs</Th>
                                        <Th>Updated</Th>
                                    </Tr>
                                </THead>
                                <TBody>
                                    {intakes.map((intake) => (
                                        <Tr key={intake.id}>
                                            <Td className="min-w-56">
                                                <Link
                                                    href={getIntakePath(intake.id)}
                                                    className="font-semibold text-gray-900 hover:text-primary hover:underline dark:text-gray-100"
                                                >
                                                    {intake.title}
                                                </Link>
                                                {!clientId && (
                                                    <div className="text-xs text-gray-500">
                                                        <Link
                                                            href={getClientPath(intake.clientId, 'intakes')}
                                                            className="hover:text-primary hover:underline"
                                                        >
                                                            {intake.clientName}
                                                        </Link>
                                                    </div>
                                                )}
                                            </Td>
                                            <Td>
                                                <IntakeStatusTag status={intake.status} />
                                            </Td>
                                            <Td>
                                                {intake.productIds.length ? (
                                                    <ProductTags productIds={intake.productIds} products={products} />
                                                ) : (
                                                    <span className="text-xs text-gray-400">None</span>
                                                )}
                                            </Td>
                                            <Td className="text-right tabular-nums">{intake.brdCount}</Td>
                                            <Td className="whitespace-nowrap">
                                                <span title={formatDate(intake.updatedAt)}>
                                                    {fromNow(intake.updatedAt)}
                                                </span>
                                            </Td>
                                        </Tr>
                                    ))}
                                </TBody>
                            </Table>
                        </div>
                    )}
                </Loading>
            )}
        </>
    )
}
