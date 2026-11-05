'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Segment from '@/components/ui/Segment'
import Table from '@/components/ui/Table'
import PageHeader from '@/components/shared/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import Loading from '@/components/shared/Loading'
import { ClientStatusTag, ProductTags } from '@/components/shared/KnowledgeTags'
import NewClientDialog from './NewClientDialog'
import navigationIcon, { AddIcon, SearchIcon } from '@/configs/icons.config'
import { getClientPath, homePath } from '@/configs/app.config'
import { useClientsStore, useProductsStore } from '@/stores/AppStores'
import { useClientsQueryStore } from '@/stores/LibraryStores'
import { CLIENT_STATUSES, clientStatusLabel, type ClientStatus } from '@/@types/clients/Client'
import useSession from '@/utils/hooks/useSession'
import useDebouncedValue from '@/utils/hooks/useDebouncedValue'
import { usePageBreadcrumbs } from '@/utils/hooks/useBreadcrumbs'
import { formatDate } from '@/utils/dates'
import classNames from '@/utils/classNames'

const { THead, TBody, Tr, Th, Td } = Table

const STATUS_FILTERS: { value: ClientStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    ...CLIENT_STATUSES.map((status) => ({ value: status, label: clientStatusLabel[status] })),
]

/** Search box that updates the query after typing pauses */
function ClientSearch() {
    const setQuery = useClientsQueryStore((s) => s.setQuery)
    const storeQuery = useClientsQueryStore((s) => s.query.q)
    const [text, setText] = useState(storeQuery)
    const debounced = useDebouncedValue(text.trim(), 350)
    useEffect(() => {
        if (useClientsQueryStore.getState().query.q !== debounced) setQuery({ q: debounced })
    }, [debounced, setQuery])

    return (
        <div className="w-full md:w-80">
            <label htmlFor="client-search" className="sr-only">
                Search clients
            </label>
            <Input
                id="client-search"
                size="sm"
                type="search"
                prefix={<SearchIcon className="text-lg text-gray-400" />}
                placeholder="Search by name, industry or summary"
                value={text}
                onChange={(e) => setText(e.target.value)}
            />
        </div>
    )
}

/** Every client, with their status, products and owner */
export default function ClientsClientPage() {
    usePageBreadcrumbs([{ label: 'Home', href: homePath }, { label: 'Clients' }])
    const { can } = useSession()
    const canManage = can('clients.manage')
    const data = useClientsStore((s) => s.data)
    const loading = useClientsStore((s) => s.loading)
    const validating = useClientsStore((s) => s.validating)
    const error = useClientsStore((s) => s.error)
    const refresh = useClientsStore((s) => s.refresh)
    const query = useClientsQueryStore((s) => s.query)
    const setQuery = useClientsQueryStore((s) => s.setQuery)
    const products = useProductsStore((s) => s.data)
    const [creating, setCreating] = useState(false)

    const clients = data ?? []
    const filtered = !!query.q || !!query.status

    return (
        <>
            <PageHeader
                eyebrow="Clients"
                title="Clients"
                description="Everything connects to a client: their knowledge, library assets, discovery intakes and BRDs. Shared knowledge applies to all of them."
                actions={
                    canManage && (
                        <Button variant="solid" size="sm" icon={<AddIcon />} onClick={() => setCreating(true)}>
                            New client
                        </Button>
                    )
                }
            />
            <Card bodyClass="p-0">
                <div className="flex flex-col gap-3 border-b border-gray-200 p-4 md:flex-row md:items-center md:justify-between dark:border-gray-700">
                    <ClientSearch />
                    <Segment
                        size="sm"
                        value={query.status ?? 'all'}
                        onChange={(value) => {
                            if (typeof value !== 'string' || !value) return // clicking the active filter keeps it
                            setQuery({ status: value === 'all' ? null : (value as ClientStatus) })
                        }}
                        aria-label="Filter by status"
                    >
                        {STATUS_FILTERS.map((filter) => (
                            <Segment.Item key={filter.value} value={filter.value} type="button">
                                {filter.label}
                            </Segment.Item>
                        ))}
                    </Segment>
                </div>

                {error && !data ? (
                    <ErrorState message={error} onRetry={() => void refresh()} />
                ) : (
                    <Loading loading={loading && !data} message="Loading clients…">
                        {clients.length === 0 ? (
                            <EmptyState
                                icon={filtered ? <SearchIcon /> : navigationIcon.clients}
                                title={filtered ? 'No clients match' : 'No clients yet'}
                                description={
                                    filtered
                                        ? 'Try a different name or industry, or clear the status filter.'
                                        : canManage
                                          ? 'Add your first client to start collecting their knowledge, assets, intakes and BRDs in one place.'
                                          : 'Editors add clients here. Until then, shared knowledge is in the Knowledge section.'
                                }
                                action={
                                    filtered ? (
                                        <Button size="sm" onClick={() => setQuery({ q: '', status: null })}>
                                            Clear filters
                                        </Button>
                                    ) : canManage ? (
                                        <Button
                                            size="sm"
                                            variant="solid"
                                            icon={<AddIcon />}
                                            onClick={() => setCreating(true)}
                                        >
                                            New client
                                        </Button>
                                    ) : undefined
                                }
                            />
                        ) : (
                            <div className="overflow-x-auto">
                                <Table
                                    hoverable
                                    className={classNames(validating && 'opacity-70 transition-opacity')}
                                    aria-busy={validating}
                                >
                                    <THead>
                                        <Tr>
                                            <Th>Client</Th>
                                            <Th>Industry</Th>
                                            <Th>Status</Th>
                                            <Th>Products</Th>
                                            <Th>Owner</Th>
                                            <Th>Updated</Th>
                                        </Tr>
                                    </THead>
                                    <TBody>
                                        {clients.map((client) => (
                                            <Tr key={client.id}>
                                                <Td className="min-w-64">
                                                    <Link
                                                        href={getClientPath(client.id)}
                                                        className="font-semibold text-gray-900 hover:text-primary dark:text-gray-100"
                                                    >
                                                        {client.name}
                                                    </Link>
                                                    {client.summary && (
                                                        <div className="line-clamp-1 max-w-md text-xs text-gray-500 dark:text-gray-400">
                                                            {client.summary}
                                                        </div>
                                                    )}
                                                </Td>
                                                <Td className="whitespace-nowrap">{client.industry || '—'}</Td>
                                                <Td>
                                                    <ClientStatusTag status={client.status} />
                                                </Td>
                                                <Td className="min-w-40">
                                                    {client.productIds.length ? (
                                                        <ProductTags
                                                            productIds={client.productIds}
                                                            products={products}
                                                        />
                                                    ) : (
                                                        <span className="text-gray-400">—</span>
                                                    )}
                                                </Td>
                                                <Td className="whitespace-nowrap">{client.ownerName ?? '—'}</Td>
                                                <Td className="whitespace-nowrap">{formatDate(client.updatedAt)}</Td>
                                            </Tr>
                                        ))}
                                    </TBody>
                                </Table>
                            </div>
                        )}
                    </Loading>
                )}
                {clients.length > 0 && (
                    <div className="border-t border-gray-200 px-4 py-3 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                        {clients.length === 1 ? '1 client' : `${clients.length.toLocaleString()} clients`}
                    </div>
                )}
            </Card>

            {creating && <NewClientDialog onClose={() => setCreating(false)} />}
        </>
    )
}
