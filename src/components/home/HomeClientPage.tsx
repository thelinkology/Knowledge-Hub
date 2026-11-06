'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ErrorState from '@/components/shared/ErrorState'
import Loading from '@/components/shared/Loading'
import StatTile from '@/components/shared/StatTile'
import KnowledgeSearchBox from '@/components/knowledge/browse/KnowledgeSearchBox'
import ProductCards from '@/components/knowledge/browse/ProductCards'
import HomeLists from './HomeLists'
import HomeHeroBackdrop from './HomeHeroBackdrop'
import navigationIcon, { EditIcon } from '@/configs/icons.config'
import {
    clientsPath,
    getKnowledgeSearchPath,
    intakesPath,
    knowledgePath,
    libraryPath,
    portalName,
    portalTagline,
} from '@/configs/app.config'
import { getBrowseHref } from '@/components/knowledge/browse/browseParams'
import { useHomeStore, useProductsStore } from '@/stores/AppStores'
import useSession from '@/utils/hooks/useSession'
import { usePageBreadcrumbs } from '@/utils/hooks/useBreadcrumbs'
import type { ReactNode } from 'react'

/** The home page: search first, then what's new in knowledge and (for editors) delivery work */
export default function HomeClientPage() {
    usePageBreadcrumbs([{ label: 'Home' }])
    const router = useRouter()
    const { user, can } = useSession()
    const data = useHomeStore((s) => s.data)
    const error = useHomeStore((s) => s.error)
    const refresh = useHomeStore((s) => s.refresh)
    const products = useProductsStore((s) => s.data)
    const firstName = user?.name.trim().split(/\s+/)[0]

    const search = (q: string) => router.push(q ? getKnowledgeSearchPath(q) : knowledgePath)

    return (
        <>
            <section className="relative isolate mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-primary-subtle px-4 py-8 sm:px-8 md:py-14 dark:border-gray-700">
                <HomeHeroBackdrop />
                <div className="animate-rise-in mx-auto max-w-3xl text-center">
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">{portalName}</div>
                    <h1 className="text-2xl md:text-4xl">{firstName ? `Welcome back, ${firstName}` : 'Welcome'}</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">
                        {portalTagline}{' '}
                        {can('library.read')
                            ? 'Search articles, best practices and reusable assets from past delivery work.'
                            : 'Search articles, how-tos and best practices from past delivery work.'}
                    </p>
                    <KnowledgeSearchBox onSearch={search} className="mt-6 text-left" />
                </div>
            </section>

            {!data ? (
                error ? (
                    <ErrorState message={error} onRetry={() => void refresh()} />
                ) : (
                    <Loading loading message="Loading your overview…" />
                )
            ) : (
                <div className="space-y-8">
                    <section aria-label="At a glance" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                        <StatLink href={knowledgePath}>
                            <StatTile
                                label="Published articles"
                                tone="blue"
                                value={data.counts.articles.toLocaleString()}
                                icon={navigationIcon.article}
                            />
                        </StatLink>
                        {can('library.read') && (
                            <StatLink href={libraryPath}>
                                <StatTile
                                    label="Library assets"
                                    tone="violet"
                                    value={data.counts.assets.toLocaleString()}
                                    icon={navigationIcon.library}
                                />
                            </StatLink>
                        )}
                        {can('clients.read') && (
                            <StatLink href={clientsPath}>
                                <StatTile
                                    label="Clients"
                                    tone="teal"
                                    value={data.counts.clients.toLocaleString()}
                                    icon={navigationIcon.clients}
                                />
                            </StatLink>
                        )}
                        {can('knowledge.manage') && (
                            <StatLink href={knowledgePath}>
                                <StatTile
                                    label="Draft articles"
                                    tone="amber"
                                    value={data.counts.drafts.toLocaleString()}
                                    hint="Not published yet"
                                    icon={<EditIcon />}
                                />
                            </StatLink>
                        )}
                        {can('requirements.manage') && (
                            <StatLink href={intakesPath}>
                                <StatTile
                                    label="Discovery intakes"
                                    tone="rose"
                                    value={data.counts.intakes.toLocaleString()}
                                    icon={navigationIcon.intake}
                                />
                            </StatLink>
                        )}
                    </section>

                    {products && products.some((p) => p.active) && (
                        <section aria-labelledby="home-products-heading">
                            <div className="mb-3 flex items-baseline justify-between gap-2">
                                <h2 id="home-products-heading" className="text-lg font-semibold">
                                    Browse by product
                                </h2>
                                <Link href={getBrowseHref({})} className="text-sm text-primary hover:underline">
                                    All knowledge
                                </Link>
                            </div>
                            <ProductCards products={products} />
                        </section>
                    )}

                    <HomeLists overview={data} products={products} />
                </div>
            )}
        </>
    )
}

/** A stat tile that opens the matching page */
function StatLink({ href, children }: { href: string; children: ReactNode }) {
    return (
        <Link
            href={href}
            className="block rounded-2xl transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary motion-reduce:transition-none motion-reduce:hover:translate-y-0 [&>div]:h-full"
        >
            {children}
        </Link>
    )
}
