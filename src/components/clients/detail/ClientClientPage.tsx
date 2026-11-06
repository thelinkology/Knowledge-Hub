'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Button from '@/components/ui/Button'
import Tabs from '@/components/ui/Tabs'
import PageHeader from '@/components/shared/PageHeader'
import ErrorState from '@/components/shared/ErrorState'
import Loading from '@/components/shared/Loading'
import StatTile from '@/components/shared/StatTile'
import { ClientStatusTag, ProductTags } from '@/components/shared/KnowledgeTags'
import ClientOverview from './ClientOverview'
import ClientEditForm from './ClientEditForm'
import DeleteClientDialog from './DeleteClientDialog'
import ClientKnowledgeTab from '@/components/clients/tabs/ClientKnowledgeTab'
import ClientLibraryTab from '@/components/clients/tabs/ClientLibraryTab'
import ClientIntakesTab from '@/components/clients/tabs/ClientIntakesTab'
import ClientBrdsTab from '@/components/clients/tabs/ClientBrdsTab'
import navigationIcon, { DeleteIcon, EditIcon, ExternalLinkIcon, InfoIcon, PeopleIcon } from '@/configs/icons.config'
import { clientsPath, getClientPath, type ClientTab } from '@/configs/app.config'
import { useClientStore, useProductsStore } from '@/stores/AppStores'
import useSession from '@/utils/hooks/useSession'
import { usePageBreadcrumbs } from '@/utils/hooks/useBreadcrumbs'
import classNames from '@/utils/classNames'
import type { Client } from '@/@types/clients/Client'

interface ClientClientPageProps {
    clientId: string
}

/** One client: their details and notes, and everything that belongs to them, in tabs (?tab=) */
export default function ClientClientPage({ clientId }: ClientClientPageProps) {
    const client = useClientStore(clientId, (s) => s.data)
    const error = useClientStore(clientId, (s) => s.error)
    const refresh = useClientStore(clientId, (s) => s.refresh)

    usePageBreadcrumbs([{ label: 'Clients', href: clientsPath }, { label: client?.name ?? 'Client' }])

    if (!client)
        return error ? (
            <ErrorState message={error} onRetry={() => void refresh()} />
        ) : (
            <Loading loading message="Opening the client…" />
        )
    return <ClientView client={client} />
}

/** "contoso.com" for a website link */
const websiteHost = (url: string) => {
    try {
        return new URL(url).host.replace(/^www\./, '')
    } catch {
        return url
    }
}

function ClientView({ client }: { client: Client }) {
    const { can } = useSession()
    const canManage = can('clients.manage')
    const canRequirements = can('requirements.manage')
    const products = useProductsStore((s) => s.data)
    const searchParams = useSearchParams()
    const [editing, setEditing] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)

    const tabs: ClientTab[] = [
        'overview',
        'knowledge',
        'library',
        ...(canRequirements ? (['intakes', 'brds'] as const) : []),
    ]
    const requested = searchParams.get('tab') as ClientTab | null
    const tab: ClientTab = requested && tabs.includes(requested) ? requested : 'overview'

    // The tab lives in the URL (?tab=), so it can be shared and survives a reload; no server round trip
    const selectTab = (next: ClientTab) => window.history.replaceState(null, '', getClientPath(client.id, next))

    const startEditing = () => {
        selectTab('overview')
        setEditing(true)
    }

    const option = { id: client.id, name: client.name }
    const tiles: { tab: ClientTab; label: string; count: number; icon: ReactNode }[] = [
        { tab: 'knowledge', label: 'Articles', count: client.counts.articles, icon: navigationIcon.article },
        { tab: 'library', label: 'Library assets', count: client.counts.assets, icon: navigationIcon.library },
        ...(canRequirements
            ? [
                  {
                      tab: 'intakes' as const,
                      label: 'Intakes',
                      count: client.counts.intakes,
                      icon: navigationIcon.intake,
                  },
                  { tab: 'brds' as const, label: 'BRDs', count: client.counts.brds, icon: navigationIcon.brd },
              ]
            : []),
    ]

    return (
        <>
            <PageHeader
                eyebrow="Client"
                title={client.name}
                description={
                    <div className="flex flex-col gap-2">
                        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                            <ClientStatusTag status={client.status} />
                            {client.industry && <span>{client.industry}</span>}
                            {client.website && (
                                <a
                                    href={client.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-primary hover:underline"
                                >
                                    {websiteHost(client.website)}
                                    <ExternalLinkIcon aria-hidden />
                                    <span className="sr-only">(opens in a new tab)</span>
                                </a>
                            )}
                            {client.ownerName && (
                                <span className="inline-flex items-center gap-1">
                                    <PeopleIcon aria-hidden /> Owner: {client.ownerName}
                                </span>
                            )}
                        </span>
                        {client.productIds.length > 0 && (
                            <ProductTags productIds={client.productIds} products={products} />
                        )}
                    </div>
                }
                actions={
                    canManage && (
                        <>
                            <Button size="sm" icon={<EditIcon />} onClick={startEditing} disabled={editing}>
                                Edit client
                            </Button>
                            <Button
                                size="sm"
                                variant="plain"
                                icon={<DeleteIcon />}
                                aria-label={`Delete ${client.name}`}
                                onClick={() => setConfirmDelete(true)}
                            />
                        </>
                    )
                }
            />

            <div className={classNames('mb-6 grid grid-cols-2 gap-3', tiles.length > 2 && 'md:grid-cols-4')}>
                {tiles.map((tile) => {
                    const stat = (
                        <StatTile
                            label={tile.label}
                            value={tile.count.toLocaleString()}
                            icon={tile.icon}
                            className={classNames(
                                'h-full',
                                tab === tile.tab && 'border-primary dark:border-primary',
                                !editing && 'transition group-hover:border-primary',
                            )}
                        />
                    )
                    // While the edit form is open, switching tabs would drop it, so the tiles are just numbers
                    return editing ? (
                        <div key={tile.tab}>{stat}</div>
                    ) : (
                        <Link
                            key={tile.tab}
                            href={getClientPath(client.id, tile.tab)}
                            scroll={false}
                            onClick={(e) => {
                                e.preventDefault()
                                selectTab(tile.tab)
                            }}
                            aria-current={tab === tile.tab ? 'true' : undefined}
                            className="group rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >
                            {stat}
                        </Link>
                    )
                })}
            </div>

            <Tabs value={tab} onChange={(value) => selectTab(value as ClientTab)}>
                <Tabs.TabList className="mb-6">
                    <Tabs.TabNav value="overview" icon={<InfoIcon />}>
                        Overview
                    </Tabs.TabNav>
                    <Tabs.TabNav value="knowledge" icon={navigationIcon.knowledge} disabled={editing}>
                        Knowledge
                    </Tabs.TabNav>
                    <Tabs.TabNav value="library" icon={navigationIcon.library} disabled={editing}>
                        Library
                    </Tabs.TabNav>
                    {canRequirements && (
                        <Tabs.TabNav value="intakes" icon={navigationIcon.intake} disabled={editing}>
                            Intakes
                        </Tabs.TabNav>
                    )}
                    {canRequirements && (
                        <Tabs.TabNav value="brds" icon={navigationIcon.brd} disabled={editing}>
                            BRDs
                        </Tabs.TabNav>
                    )}
                </Tabs.TabList>
                <Tabs.TabContent value="overview">
                    {editing ? (
                        <ClientEditForm client={client} onDone={() => setEditing(false)} />
                    ) : (
                        <ClientOverview client={client} canManage={canManage} onEdit={startEditing} />
                    )}
                </Tabs.TabContent>
                <Tabs.TabContent value="knowledge">
                    <ClientKnowledgeTab client={option} />
                </Tabs.TabContent>
                <Tabs.TabContent value="library">
                    <ClientLibraryTab client={option} />
                </Tabs.TabContent>
                {canRequirements && (
                    <Tabs.TabContent value="intakes">
                        <ClientIntakesTab clientId={client.id} />
                    </Tabs.TabContent>
                )}
                {canRequirements && (
                    <Tabs.TabContent value="brds">
                        <ClientBrdsTab clientId={client.id} />
                    </Tabs.TabContent>
                )}
            </Tabs>

            {canManage && (
                <DeleteClientDialog client={client} isOpen={confirmDelete} onClose={() => setConfirmDelete(false)} />
            )}
        </>
    )
}
