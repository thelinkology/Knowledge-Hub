'use client'

import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { CloseIcon } from '@/configs/icons.config'
import { SHARED_CLIENT, hasNarrowingFilters, type BrowseFilters as Filters } from './browseParams'
import { ARTICLE_KINDS, articleKindLabel, type ArticleKind } from '@/@types/knowledge/ArticleKindOptions'
import type { ClientSummary } from '@/@types/clients/Client'
import type { Product } from '@/@types/products/Product'

interface BrowseFiltersProps {
    filters: Filters
    products: Product[] | undefined
    clients: ClientSummary[] | undefined
    clientsLoading?: boolean
    onChange: (patch: Partial<Filters>) => void
}

const KIND_OPTIONS: { value: ArticleKind | ''; label: string }[] = [
    { value: '', label: 'Every type' },
    ...ARTICLE_KINDS.map((kind) => ({ value: kind, label: articleKindLabel[kind] })),
]

/** Product, client and article-type filters (kept in the URL by the page) */
export default function BrowseFilters({ filters, products, clients, clientsLoading, onChange }: BrowseFiltersProps) {
    const productOptions = [
        { value: '', label: 'Every product' },
        ...(products ?? [])
            .filter((p) => p.active || p.id === filters.product)
            .map((p) => ({ value: p.id, label: p.name })),
    ]
    const clientOptions = [
        { value: '', label: 'Shared and client knowledge' },
        { value: SHARED_CLIENT, label: 'Shared knowledge only' },
        ...(clients ?? []).map((c) => ({ value: c.id, label: c.name })),
    ]

    return (
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="grid flex-1 gap-3 sm:grid-cols-3">
                <div>
                    <label htmlFor="browse-product" className="mb-1 block text-xs font-semibold text-gray-500">
                        Product
                    </label>
                    <Select
                        inputId="browse-product"
                        size="sm"
                        options={productOptions}
                        value={productOptions.find((o) => o.value === filters.product) ?? productOptions[0]}
                        onChange={(option) => onChange({ product: option?.value ?? '' })}
                        isSearchable={false}
                    />
                </div>
                <div>
                    <label htmlFor="browse-client" className="mb-1 block text-xs font-semibold text-gray-500">
                        Client
                    </label>
                    <Select
                        inputId="browse-client"
                        size="sm"
                        options={clientOptions}
                        isLoading={clientsLoading}
                        value={clientOptions.find((o) => o.value === filters.client) ?? clientOptions[0]}
                        onChange={(option) => onChange({ client: option?.value ?? '' })}
                    />
                </div>
                <div>
                    <label htmlFor="browse-kind" className="mb-1 block text-xs font-semibold text-gray-500">
                        Article type
                    </label>
                    <Select
                        inputId="browse-kind"
                        size="sm"
                        options={KIND_OPTIONS}
                        value={KIND_OPTIONS.find((o) => o.value === filters.kind) ?? KIND_OPTIONS[0]}
                        onChange={(option) => onChange({ kind: option?.value ?? '' })}
                        isSearchable={false}
                    />
                </div>
            </div>
            {hasNarrowingFilters(filters) && (
                <Button
                    size="sm"
                    variant="plain"
                    icon={<CloseIcon />}
                    onClick={() => onChange({ product: '', client: '', kind: '' })}
                >
                    Clear filters
                </Button>
            )}
        </div>
    )
}
