'use client'

import { useState } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import Loading from '@/components/shared/Loading'
import AssetCard from '@/components/library/AssetCard'
import NewAssetDialog from '@/components/library/NewAssetDialog'
import navigationIcon, { AddIcon } from '@/configs/icons.config'
import { libraryPath } from '@/configs/app.config'
import { useSWRAssets } from '@/services/library'
import { useProductsStore } from '@/stores/AppStores'
import useSession from '@/utils/hooks/useSession'
import { tryGetErrorMessage } from '@/utils/errors'
import type { ClientOption } from '@/@types/clients/Client'

interface ClientLibraryTabProps {
    client: ClientOption
}

/** The library assets made for one client (shared assets live in the Library) */
export default function ClientLibraryTab({ client }: ClientLibraryTabProps) {
    const { can } = useSession()
    const canManage = can('knowledge.manage')
    const assets = useSWRAssets({ clientId: client.id })
    const products = useProductsStore((s) => s.data)
    const [creating, setCreating] = useState(false)
    const list = assets.data ?? []

    const newButton = canManage && (
        <Button size="sm" variant="solid" icon={<AddIcon />} onClick={() => setCreating(true)}>
            New asset for this client
        </Button>
    )

    return (
        <>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Scripts, architectures and demo assets made for {client.name}. Reusable ones for every client are in
                    the{' '}
                    <Link href={libraryPath} className="text-primary hover:underline">
                        Library
                    </Link>
                    .
                </p>
                {list.length > 0 && newButton}
            </div>
            {assets.error && !assets.data ? (
                <ErrorState message={tryGetErrorMessage(assets.error)} onRetry={() => void assets.mutate()} />
            ) : (
                <Loading loading={assets.isLoading && !assets.data} message="Loading assets…">
                    {list.length === 0 ? (
                        <Card>
                            <EmptyState
                                icon={navigationIcon.library}
                                title="No assets for this client yet"
                                description={
                                    canManage
                                        ? `Keep ${client.name}’s scripts, architectures and demo assets here so the next person on the account can reuse them.`
                                        : `Editors keep ${client.name}’s scripts, architectures and demo assets here.`
                                }
                                action={newButton || undefined}
                            />
                        </Card>
                    ) : (
                        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label={`${client.name} assets`}>
                            {list.map((asset) => (
                                <li key={asset.id}>
                                    <AssetCard asset={asset} products={products} showScope={false} />
                                </li>
                            ))}
                        </ul>
                    )}
                </Loading>
            )}
            {creating && <NewAssetDialog client={client} onClose={() => setCreating(false)} />}
        </>
    )
}
