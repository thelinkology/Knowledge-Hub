'use client'

import { Fragment, useState } from 'react'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import Select from '@/components/ui/Select'
import Pagination from '@/components/ui/Pagination'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import PageHeader from '@/components/shared/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import Loading from '@/components/shared/Loading'
import AuditDetails, { getAuditActionLabel } from './AuditDetails'
import { AuditIcon, CollapseIcon, ExpandIcon } from '@/configs/icons.config'
import { useAuditStore } from '@/stores/AdminStores'
import { roleLabel } from '@/@types/auth/Roles'
import { usePageBreadcrumbs } from '@/utils/hooks/useBreadcrumbs'
import { formatDateTime, fromNow } from '@/utils/dates'
import { homePath } from '@/configs/app.config'
import { AUDIT_PAGE_SIZE } from '@/constants/app.constant'

const { THead, TBody, Tr, Th, Td } = Table

const PAGE_SIZE = AUDIT_PAGE_SIZE

const ENTITY_OPTIONS = [
    { value: '', label: 'All records' },
    { value: 'user', label: 'Users & roles' },
    { value: 'client', label: 'Clients' },
    { value: 'article', label: 'Articles' },
    { value: 'collection', label: 'Collections' },
    { value: 'asset', label: 'Library assets' },
    { value: 'intake', label: 'Intakes' },
    { value: 'brd', label: 'BRDs' },
    { value: 'product', label: 'Products' },
    { value: 'settings', label: 'Intake settings' },
    { value: 'api_key', label: 'Agent API keys' },
]

const entityLabel = (type: string) => ENTITY_OPTIONS.find((o) => o.value === type)?.label ?? type

/** Every consequential change (roles, rules, XP adjustments, publishing) with who made it and when. */
export default function AuditClientPage() {
    usePageBreadcrumbs([{ label: 'Home', href: homePath }, { label: 'Audit log' }])
    const data = useAuditStore((s) => s.data)
    const loading = useAuditStore((s) => s.loading)
    const validating = useAuditStore((s) => s.validating)
    const error = useAuditStore((s) => s.error)
    const refresh = useAuditStore((s) => s.refresh)
    const query = useAuditStore((s) => s.query)
    const setQuery = useAuditStore((s) => s.setQuery)
    const [expanded, setExpanded] = useState<string | null>(null)

    const records = data?.records ?? []
    const selectedEntity = ENTITY_OPTIONS.find((o) => o.value === (query.entityType ?? '')) ?? ENTITY_OPTIONS[0]

    return (
        <>
            <PageHeader
                eyebrow="Administration"
                title="Audit log"
                description="Who changed roles, published or deleted content, generated BRDs or issued agent keys — and when."
            />
            <Card bodyClass="p-0">
                <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700">
                    <div className="w-full sm:w-64">
                        <label htmlFor="audit-entity" className="sr-only">
                            Show
                        </label>
                        <Select
                            inputId="audit-entity"
                            size="sm"
                            options={ENTITY_OPTIONS}
                            value={selectedEntity}
                            isSearchable={false}
                            onChange={(option) => setQuery({ entityType: option?.value || null })}
                        />
                    </div>
                    {data && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {data.total.toLocaleString()} {data.total === 1 ? 'record' : 'records'}
                            {validating && ' · updating…'}
                        </span>
                    )}
                </div>

                {error && !data ? (
                    <ErrorState message={error} onRetry={() => void refresh()} />
                ) : (
                    <Loading loading={loading && !data} message="Loading the audit log…">
                        {records.length === 0 ? (
                            <EmptyState
                                icon={<AuditIcon />}
                                title={query.entityType ? 'No records of this kind yet' : 'Nothing recorded yet'}
                                description={
                                    query.entityType
                                        ? 'Try another filter, or show all records.'
                                        : 'Changes to roles, rules, XP and published content will appear here as they happen.'
                                }
                                action={
                                    query.entityType ? (
                                        <Button size="sm" onClick={() => setQuery({ entityType: null })}>
                                            Show all records
                                        </Button>
                                    ) : undefined
                                }
                            />
                        ) : (
                            <div className="overflow-x-auto">
                                <Table hoverable>
                                    <THead>
                                        <Tr>
                                            <Th>When</Th>
                                            <Th>Who</Th>
                                            <Th>What</Th>
                                            <Th>Record</Th>
                                            <Th>
                                                <span className="sr-only">Details</span>
                                            </Th>
                                        </Tr>
                                    </THead>
                                    <TBody>
                                        {records.map((event) => {
                                            const open = expanded === event.id
                                            return (
                                                <Fragment key={event.id}>
                                                    <Tr>
                                                        <Td className="whitespace-nowrap">
                                                            <span title={formatDateTime(event.createdAt)}>
                                                                {fromNow(event.createdAt)}
                                                            </span>
                                                        </Td>
                                                        <Td className="whitespace-nowrap">
                                                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                                                                {event.actorName ?? 'System'}
                                                            </div>
                                                            {event.actorRole && (
                                                                <div className="text-xs text-gray-500">
                                                                    {roleLabel[event.actorRole]}
                                                                </div>
                                                            )}
                                                        </Td>
                                                        <Td>{getAuditActionLabel(event.action)}</Td>
                                                        <Td>
                                                            <Tag className="border-transparent bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-200">
                                                                {entityLabel(event.entityType)}
                                                            </Tag>
                                                        </Td>
                                                        <Td className="text-right">
                                                            <Button
                                                                size="xs"
                                                                variant="plain"
                                                                icon={open ? <CollapseIcon /> : <ExpandIcon />}
                                                                aria-expanded={open}
                                                                onClick={() => setExpanded(open ? null : event.id)}
                                                            >
                                                                {open ? 'Hide' : 'Details'}
                                                            </Button>
                                                        </Td>
                                                    </Tr>
                                                    {open && (
                                                        <Tr>
                                                            <Td colSpan={5} className="bg-gray-50 dark:bg-gray-900">
                                                                <AuditDetails details={event.details} />
                                                                <p className="mt-2 text-xs text-gray-500">
                                                                    {formatDateTime(event.createdAt)}
                                                                    {event.entityId && ` · id ${event.entityId}`}
                                                                </p>
                                                            </Td>
                                                        </Tr>
                                                    )}
                                                </Fragment>
                                            )
                                        })}
                                    </TBody>
                                </Table>
                            </div>
                        )}
                    </Loading>
                )}

                {data && data.total > PAGE_SIZE && (
                    <div className="flex justify-end border-t border-gray-200 p-4 dark:border-gray-700">
                        <Pagination
                            total={data.total}
                            pageSize={PAGE_SIZE}
                            currentPage={query.page}
                            onChange={(page) => {
                                setExpanded(null)
                                setQuery({ page })
                            }}
                        />
                    </div>
                )}
            </Card>
        </>
    )
}
