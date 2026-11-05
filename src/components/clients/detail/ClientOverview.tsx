'use client'

import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/shared/EmptyState'
import MarkdownContent from '@/components/shared/MarkdownContent'
import { ClientStatusTag, ProductTags } from '@/components/shared/KnowledgeTags'
import { EditIcon } from '@/configs/icons.config'
import { useProductsStore } from '@/stores/AppStores'
import { formatDate } from '@/utils/dates'
import type { Client } from '@/@types/clients/Client'
import type { ReactNode } from 'react'

interface ClientOverviewProps {
    client: Client
    canManage: boolean
    onEdit: () => void
}

/** The client's summary, details and account notes */
export default function ClientOverview({ client, canManage, onEdit }: ClientOverviewProps) {
    const products = useProductsStore((s) => s.data)

    return (
        <div className="grid gap-6 lg:grid-cols-3">
            <div className="min-w-0 lg:col-span-2">
                <Card header={{ content: 'Account notes' }}>
                    {client.notes.trim() ? (
                        <MarkdownContent>{client.notes}</MarkdownContent>
                    ) : (
                        <EmptyState
                            compact
                            icon={<EditIcon />}
                            title="No account notes yet"
                            description={
                                canManage
                                    ? 'Capture stakeholders, environments, decisions and history, so the next person on the account is up to speed.'
                                    : 'Editors keep notes about this account here: stakeholders, environments and decisions.'
                            }
                            action={
                                canManage ? (
                                    <Button size="sm" icon={<EditIcon />} onClick={onEdit}>
                                        Add notes
                                    </Button>
                                ) : undefined
                            }
                        />
                    )}
                </Card>
            </div>
            <aside>
                <Card header={{ content: 'About' }}>
                    <p className="mb-4 text-gray-700 dark:text-gray-200">
                        {client.summary || (
                            <span className="text-gray-400 italic dark:text-gray-500">No summary yet.</span>
                        )}
                    </p>
                    <dl className="space-y-3 text-sm">
                        <Detail label="Status">
                            <ClientStatusTag status={client.status} />
                        </Detail>
                        <Detail label="Industry">{client.industry || '—'}</Detail>
                        <Detail label="Owner">{client.ownerName ?? 'No owner'}</Detail>
                        <Detail label="Products">
                            {client.productIds.length ? (
                                <ProductTags productIds={client.productIds} products={products} />
                            ) : (
                                'None yet'
                            )}
                        </Detail>
                        <Detail label="Added">{formatDate(client.createdAt)}</Detail>
                        <Detail label="Updated">{formatDate(client.updatedAt)}</Detail>
                    </dl>
                </Card>
            </aside>
        </div>
    )
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
            <dd className="mt-0.5 font-medium text-gray-900 dark:text-gray-100">{children}</dd>
        </div>
    )
}
