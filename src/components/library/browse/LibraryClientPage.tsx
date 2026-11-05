'use client'

import { useEffect, useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Tabs from '@/components/ui/Tabs'
import PageHeader from '@/components/shared/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import Loading from '@/components/shared/Loading'
import AssetCard from '../AssetCard'
import NewAssetDialog from '../NewAssetDialog'
import navigationIcon, { AddIcon, SearchIcon } from '@/configs/icons.config'
import { homePath } from '@/configs/app.config'
import { useProductsStore } from '@/stores/AppStores'
import { useClientOptionsStore, useLibraryStore } from '@/stores/LibraryStores'
import { ASSET_KINDS, assetKindIcon, assetKindLabel, assetKindPlural, type AssetKind } from '@/@types/library/Asset'
import useSession from '@/utils/hooks/useSession'
import useDebouncedValue from '@/utils/hooks/useDebouncedValue'
import { usePageBreadcrumbs } from '@/utils/hooks/useBreadcrumbs'
import classNames from '@/utils/classNames'

const ALL = 'all'

/** Search box that updates the store's query after typing pauses */
function LibrarySearch() {
    const setQuery = useLibraryStore((s) => s.setQuery)
    const storeQuery = useLibraryStore((s) => s.query.q)
    const [text, setText] = useState(storeQuery)
    const debounced = useDebouncedValue(text.trim(), 350)
    useEffect(() => {
        if (useLibraryStore.getState().query.q !== debounced) setQuery({ q: debounced })
    }, [debounced, setQuery])

    return (
        <div className="w-full lg:max-w-sm">
            <label htmlFor="library-search" className="sr-only">
                Search the library
            </label>
            <Input
                id="library-search"
                size="sm"
                type="search"
                prefix={<SearchIcon className="text-lg text-gray-400" />}
                placeholder="Search titles and summaries"
                value={text}
                onChange={(e) => setText(e.target.value)}
            />
        </div>
    )
}

/** Product and client filters */
function LibraryFilters() {
    const query = useLibraryStore((s) => s.query)
    const setQuery = useLibraryStore((s) => s.setQuery)
    const products = useProductsStore((s) => s.data)
    const clients = useClientOptionsStore((s) => s.data)

    const productOptions = [
        { value: '', label: 'All products' },
        ...(products ?? []).map((p) => ({ value: p.id, label: p.name })),
    ]
    const clientOptions = [
        { value: '', label: 'All clients' },
        ...(clients ?? []).map((c) => ({ value: c.id, label: c.name })),
    ]

    return (
        <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[28rem]">
            <Select
                size="sm"
                aria-label="Filter by product"
                options={productOptions}
                value={productOptions.find((o) => o.value === (query.productId ?? '')) ?? productOptions[0]}
                onChange={(option) => setQuery({ productId: option?.value || null })}
                isSearchable={false}
            />
            <Select
                size="sm"
                aria-label="Filter by client"
                options={clientOptions}
                value={clientOptions.find((o) => o.value === (query.clientId ?? '')) ?? clientOptions[0]}
                onChange={(option) => setQuery({ clientId: option?.value || null })}
            />
        </div>
    )
}

/** The library: reusable scripts, flows, reference architectures, demo assets, components and templates */
export default function LibraryClientPage() {
    usePageBreadcrumbs([{ label: 'Home', href: homePath }, { label: 'Library' }])
    const { can } = useSession()
    const canManage = can('knowledge.manage')
    const data = useLibraryStore((s) => s.data)
    const loading = useLibraryStore((s) => s.loading)
    const validating = useLibraryStore((s) => s.validating)
    const error = useLibraryStore((s) => s.error)
    const refresh = useLibraryStore((s) => s.refresh)
    const query = useLibraryStore((s) => s.query)
    const setQuery = useLibraryStore((s) => s.setQuery)
    const products = useProductsStore((s) => s.data)
    const [creating, setCreating] = useState(false)

    const counts = useMemo(() => {
        const byKind = Object.fromEntries(ASSET_KINDS.map((kind) => [kind, 0])) as Record<AssetKind, number>
        for (const asset of data ?? []) byKind[asset.kind] += 1
        return byKind
    }, [data])
    const visible = useMemo(
        () => (query.kind ? (data ?? []).filter((a) => a.kind === query.kind) : (data ?? [])),
        [data, query.kind],
    )
    const filtered = !!query.q || !!query.clientId || !!query.productId
    const kindLabel = query.kind ? assetKindPlural[query.kind].toLowerCase() : 'assets'

    const empty = () => {
        if (filtered) {
            return (
                <EmptyState
                    icon={<SearchIcon />}
                    title={`No ${kindLabel} match`}
                    description="Try other words, or clear the product and client filters."
                    action={
                        <Button size="sm" onClick={() => setQuery({ q: '', clientId: null, productId: null })}>
                            Clear filters
                        </Button>
                    }
                />
            )
        }
        return (
            <EmptyState
                icon={query.kind ? navigationIcon[assetKindIcon[query.kind]] : navigationIcon.library}
                title={query.kind ? `No ${kindLabel} yet` : 'The library is empty'}
                description={
                    canManage
                        ? 'Add the scripts, flows, reference architectures and demo assets your team reuses, so the next delivery starts from what already works.'
                        : 'Editors add reusable scripts, flows, reference architectures and demo assets here. Check back soon, or search the knowledge base meanwhile.'
                }
                action={
                    canManage ? (
                        <Button size="sm" variant="solid" icon={<AddIcon />} onClick={() => setCreating(true)}>
                            {query.kind ? `New ${assetKindLabel[query.kind].toLowerCase()}` : 'New asset'}
                        </Button>
                    ) : undefined
                }
            />
        )
    }

    return (
        <>
            <PageHeader
                eyebrow="Library"
                title="Reusable assets"
                description="Sample scripts and flows for Acterys, BPP and Fabric, reference architectures, demo assets, components and templates — ready to reuse on the next delivery."
                actions={
                    canManage && (
                        <Button variant="solid" size="sm" icon={<AddIcon />} onClick={() => setCreating(true)}>
                            New asset
                        </Button>
                    )
                }
            />

            <Card className="mb-6" bodyClass="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
                <LibrarySearch />
                <LibraryFilters />
            </Card>

            <Tabs
                value={query.kind ?? ALL}
                onChange={(value) => setQuery({ kind: value === ALL ? null : (value as AssetKind) })}
            >
                <Tabs.TabList className="mb-6">
                    <Tabs.TabNav value={ALL} icon={navigationIcon.library}>
                        All
                        <KindCount count={data?.length} />
                    </Tabs.TabNav>
                    {ASSET_KINDS.map((kind) => (
                        <Tabs.TabNav
                            key={kind}
                            value={kind}
                            icon={navigationIcon[assetKindIcon[kind]]}
                            className="whitespace-nowrap"
                        >
                            {assetKindPlural[kind]}
                            <KindCount count={data ? counts[kind] : undefined} />
                        </Tabs.TabNav>
                    ))}
                </Tabs.TabList>
            </Tabs>

            {error && !data ? (
                <ErrorState message={error} onRetry={() => void refresh()} />
            ) : (
                <Loading loading={loading && !data} message="Loading the library…">
                    {visible.length === 0 ? (
                        <Card>{empty()}</Card>
                    ) : (
                        <ul
                            className={classNames(
                                'grid gap-4 sm:grid-cols-2 xl:grid-cols-3',
                                validating && 'opacity-70 transition-opacity',
                            )}
                            aria-label={query.kind ? assetKindPlural[query.kind] : 'Library assets'}
                            aria-busy={validating}
                        >
                            {visible.map((asset) => (
                                <li key={asset.id}>
                                    <AssetCard asset={asset} products={products} />
                                </li>
                            ))}
                        </ul>
                    )}
                </Loading>
            )}

            {creating && <NewAssetDialog onClose={() => setCreating(false)} defaultKind={query.kind} />}
        </>
    )
}

function KindCount({ count }: { count: number | undefined }) {
    if (count === undefined) return null
    return (
        <span className="ml-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs font-semibold text-gray-600 tabular-nums dark:bg-gray-700 dark:text-gray-300">
            {count}
        </span>
    )
}
