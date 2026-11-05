'use client'

import Link from 'next/link'
import Card from '@/components/ui/Card'
import LinkButton from '@/components/ui/LinkButton'
import Tag from '@/components/ui/Tag'
import EmptyState from '@/components/shared/EmptyState'
import { ClientStatusTag, ProductTags } from '@/components/shared/KnowledgeTags'
import ArticleList from '@/components/knowledge/browse/ArticleList'
import navigationIcon, { AddIcon, ForwardIcon } from '@/configs/icons.config'
import { brdsPath, clientsPath, getBrdPath, getClientPath, intakesPath, knowledgePath } from '@/configs/app.config'
import useSession from '@/utils/hooks/useSession'
import { formatDate } from '@/utils/dates'
import classNames from '@/utils/classNames'
import { brdAudienceLabel, brdStatusLabel, brdStatusTagClass, type BrdSummary } from '@/@types/brds/Brd'
import type { ClientSummary } from '@/@types/clients/Client'
import type { HomeOverview } from '@/@types/reports/Overview'
import type { Product } from '@/@types/products/Product'
import type { ReactNode } from 'react'

interface HomeListsProps {
    overview: HomeOverview
    products: Product[] | undefined
}

/** Recent articles (main column); quick actions, recent clients and recent BRDs (side column) */
export default function HomeLists({ overview, products }: HomeListsProps) {
    const { can } = useSession()
    const canManageKnowledge = can('knowledge.manage')
    const canManageClients = can('clients.manage')
    const canManageRequirements = can('requirements.manage')
    const hasQuickActions = canManageKnowledge || canManageClients || canManageRequirements

    return (
        <div className="grid gap-6 lg:grid-cols-3">
            <div className="min-w-0 lg:col-span-2">
                <Card
                    header={{
                        content: (
                            <h2 className="text-base font-semibold">
                                {canManageKnowledge ? 'Recently updated articles' : 'Recently published articles'}
                            </h2>
                        ),
                        extra: <SeeAll href={knowledgePath} label="Browse knowledge" />,
                    }}
                >
                    {overview.recentArticles.length ? (
                        <ArticleList articles={overview.recentArticles} products={products} />
                    ) : (
                        <EmptyState
                            compact
                            icon={navigationIcon.article}
                            title="No articles yet"
                            description={
                                canManageKnowledge
                                    ? 'Write the first article: a how-to, a concept or a best practice the team keeps repeating.'
                                    : 'Nothing has been published yet. Check back soon.'
                            }
                            action={
                                canManageKnowledge ? (
                                    <LinkButton size="sm" href={knowledgePath} icon={<AddIcon />}>
                                        New article
                                    </LinkButton>
                                ) : undefined
                            }
                        />
                    )}
                </Card>
            </div>

            <aside className="min-w-0 space-y-6" aria-label="Clients and delivery">
                {hasQuickActions && (
                    <Card header={{ content: <h2 className="text-base font-semibold">Quick actions</h2> }}>
                        <ul className="space-y-2">
                            {canManageKnowledge && (
                                <QuickAction href={knowledgePath} icon={navigationIcon.article}>
                                    New article
                                </QuickAction>
                            )}
                            {canManageClients && (
                                <QuickAction href={clientsPath} icon={navigationIcon.clients}>
                                    New client
                                </QuickAction>
                            )}
                            {canManageRequirements && (
                                <QuickAction href={intakesPath} icon={navigationIcon.intake}>
                                    New discovery intake
                                </QuickAction>
                            )}
                        </ul>
                    </Card>
                )}

                <Card
                    header={{
                        content: <h2 className="text-base font-semibold">Recently updated clients</h2>,
                        extra: <SeeAll href={clientsPath} label="All clients" />,
                    }}
                >
                    {overview.recentClients.length ? (
                        <RecentClients clients={overview.recentClients} products={products} />
                    ) : (
                        <EmptyState
                            compact
                            icon={navigationIcon.clients}
                            title="No clients yet"
                            description={
                                canManageClients
                                    ? 'Add a client to link knowledge, intakes and BRDs to them.'
                                    : 'Clients appear here once the delivery team adds them.'
                            }
                            action={
                                canManageClients ? (
                                    <LinkButton size="sm" href={clientsPath} icon={<AddIcon />}>
                                        Add a client
                                    </LinkButton>
                                ) : undefined
                            }
                        />
                    )}
                </Card>

                {canManageRequirements && (
                    <Card
                        header={{
                            content: <h2 className="text-base font-semibold">Recent BRDs</h2>,
                            extra: <SeeAll href={brdsPath} label="All BRDs" />,
                        }}
                    >
                        {overview.recentBrds.length ? (
                            <RecentBrds brds={overview.recentBrds} />
                        ) : (
                            <EmptyState
                                compact
                                icon={navigationIcon.brd}
                                title="No BRDs yet"
                                description="Complete a discovery intake with a client, then generate the customer BRD and the internal delivery brief from it."
                                action={
                                    <LinkButton size="sm" href={intakesPath}>
                                        Go to discovery intakes
                                    </LinkButton>
                                }
                            />
                        )}
                    </Card>
                )}
            </aside>
        </div>
    )
}

function SeeAll({ href, label }: { href: string; label: string }) {
    return (
        <Link href={href} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
            {label} <ForwardIcon aria-hidden />
        </Link>
    )
}

function QuickAction({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) {
    return (
        <li>
            <Link
                href={href}
                className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2.5 font-semibold text-gray-900 transition-colors hover:border-primary hover:text-primary dark:border-gray-700 dark:text-gray-100"
            >
                <span
                    aria-hidden
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-subtle text-lg text-primary"
                >
                    {icon}
                </span>
                <span className="flex-1">{children}</span>
                <AddIcon aria-hidden className="text-gray-400" />
            </Link>
        </li>
    )
}

function RecentClients({ clients, products }: { clients: ClientSummary[]; products: Product[] | undefined }) {
    return (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {clients.map((client) => (
                <li key={client.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <Link
                                href={getClientPath(client.id)}
                                className="font-semibold text-gray-900 hover:text-primary hover:underline dark:text-gray-100"
                            >
                                {client.name}
                            </Link>
                            {client.industry && <div className="text-xs text-gray-500">{client.industry}</div>}
                        </div>
                        <ClientStatusTag status={client.status} className="shrink-0" />
                    </div>
                    <ProductTags productIds={client.productIds} products={products} className="mt-1.5" />
                </li>
            ))}
        </ul>
    )
}

function RecentBrds({ brds }: { brds: BrdSummary[] }) {
    return (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {brds.map((brd) => (
                <li key={brd.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                        <Link
                            href={getBrdPath(brd.id)}
                            className="min-w-0 font-semibold text-gray-900 hover:text-primary hover:underline dark:text-gray-100"
                        >
                            {brd.title}
                        </Link>
                        <Tag className={classNames('shrink-0', brdStatusTagClass[brd.status])}>
                            {brdStatusLabel[brd.status]}
                        </Tag>
                    </div>
                    <div className="mt-0.5 text-xs text-gray-500">
                        {brdAudienceLabel[brd.audience]} · {brd.clientName}
                        {brd.intakeTitle && ` · ${brd.intakeTitle}`}
                    </div>
                    <div className="text-xs text-gray-500">Updated {formatDate(brd.updatedAt)}</div>
                </li>
            ))}
        </ul>
    )
}
