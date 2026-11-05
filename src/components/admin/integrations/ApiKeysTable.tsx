'use client'

import Table from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'
import Tooltip from '@/components/ui/Tooltip'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import Loading from '@/components/shared/Loading'
import { AddIcon, KeyIcon, RevokeKeyIcon } from '@/configs/icons.config'
import { useApiKeysStore } from '@/stores/SettingsStores'
import { formatDate, formatDateTime, fromNow } from '@/utils/dates'
import type { ApiKey } from '@/@types/integrations/ApiKey'

const { THead, TBody, Tr, Th, Td } = Table

interface ApiKeysTableProps {
    onCreate: () => void
    onRevoke: (apiKey: ApiKey) => void
}

function KeyStatus({ apiKey }: { apiKey: ApiKey }) {
    if (apiKey.revokedAt) {
        return (
            <Tooltip title={`Revoked ${formatDateTime(apiKey.revokedAt)}`}>
                <Tag className="border-transparent bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                    Revoked
                </Tag>
            </Tooltip>
        )
    }
    return <Tag className="border-transparent bg-success-subtle text-success">Active</Tag>
}

/** The agent API keys: who made them, what they can read, when they were last used */
export default function ApiKeysTable({ onCreate, onRevoke }: ApiKeysTableProps) {
    const keys = useApiKeysStore((s) => s.data)
    const loading = useApiKeysStore((s) => s.loading)
    const validating = useApiKeysStore((s) => s.validating)
    const error = useApiKeysStore((s) => s.error)
    const refresh = useApiKeysStore((s) => s.refresh)

    if (error && !keys) return <ErrorState message={error} onRetry={() => void refresh()} />

    return (
        <Loading loading={loading && !keys} message="Loading API keys…">
            {!keys?.length ? (
                <EmptyState
                    icon={<KeyIcon />}
                    title="No API keys yet"
                    description="Create a key to connect a Copilot Studio agent. Each agent should have its own key, so you can revoke one without breaking the others."
                    action={
                        <Button size="sm" variant="solid" icon={<AddIcon />} onClick={onCreate}>
                            Create key
                        </Button>
                    }
                />
            ) : (
                <div className="overflow-x-auto">
                    <Table hoverable className={validating ? 'opacity-70 transition-opacity' : undefined}>
                        <THead>
                            <Tr>
                                <Th>Name</Th>
                                <Th>Key</Th>
                                <Th>Can read</Th>
                                <Th>Created</Th>
                                <Th>Last used</Th>
                                <Th>Status</Th>
                                <Th>
                                    <span className="sr-only">Actions</span>
                                </Th>
                            </Tr>
                        </THead>
                        <TBody>
                            {keys.map((apiKey) => (
                                <Tr key={apiKey.id} className={apiKey.revokedAt ? 'opacity-70' : undefined}>
                                    <Td className="font-semibold text-gray-900 dark:text-gray-100">{apiKey.name}</Td>
                                    <Td className="whitespace-nowrap">
                                        <code className="rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                                            {apiKey.prefix}…
                                        </code>
                                    </Td>
                                    <Td className="text-sm">
                                        {apiKey.clientName ? (
                                            <span>
                                                {apiKey.clientName}
                                                <span className="block text-xs text-gray-500">+ shared knowledge</span>
                                            </span>
                                        ) : (
                                            <span className="text-gray-600 dark:text-gray-300">All clients</span>
                                        )}
                                    </Td>
                                    <Td className="text-sm whitespace-nowrap">
                                        {formatDate(apiKey.createdAt)}
                                        <span className="block text-xs text-gray-500">
                                            {apiKey.createdByName ? `by ${apiKey.createdByName}` : 'by a removed user'}
                                        </span>
                                    </Td>
                                    <Td className="text-sm whitespace-nowrap">
                                        {apiKey.lastUsedAt ? (
                                            <Tooltip title={formatDateTime(apiKey.lastUsedAt)}>
                                                <span>{fromNow(apiKey.lastUsedAt)}</span>
                                            </Tooltip>
                                        ) : (
                                            <span className="text-gray-500">Never</span>
                                        )}
                                    </Td>
                                    <Td>
                                        <KeyStatus apiKey={apiKey} />
                                    </Td>
                                    <Td className="text-right">
                                        {!apiKey.revokedAt && (
                                            <Tooltip title="Revoke key">
                                                <Button
                                                    size="xs"
                                                    variant="plain"
                                                    icon={<RevokeKeyIcon />}
                                                    aria-label={`Revoke ${apiKey.name}`}
                                                    onClick={() => onRevoke(apiKey)}
                                                />
                                            </Tooltip>
                                        )}
                                    </Td>
                                </Tr>
                            ))}
                        </TBody>
                    </Table>
                </div>
            )}
        </Loading>
    )
}
