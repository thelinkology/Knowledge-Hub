'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'
import Tooltip from '@/components/ui/Tooltip'
import PageHeader from '@/components/shared/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import Loading from '@/components/shared/Loading'
import { ProductTag } from '@/components/shared/KnowledgeTags'
import ProductDialog from './ProductDialog'
import navigationIcon, { AddIcon, EditIcon } from '@/configs/icons.config'
import { homePath } from '@/configs/app.config'
import { useAdminProductsStore } from '@/stores/SettingsStores'
import { usePageBreadcrumbs } from '@/utils/hooks/useBreadcrumbs'
import type { Product } from '@/@types/products/Product'

const { THead, TBody, Tr, Th, Td } = Table

/** Administrators: the products and platforms the team delivers, their colours and BRD milestone templates */
export default function ProductsClientPage() {
    usePageBreadcrumbs([{ label: 'Home', href: homePath }, { label: 'Products' }])
    const products = useAdminProductsStore((s) => s.data)
    const loading = useAdminProductsStore((s) => s.loading)
    const validating = useAdminProductsStore((s) => s.validating)
    const error = useAdminProductsStore((s) => s.error)
    const refresh = useAdminProductsStore((s) => s.refresh)

    /** 'new' = the add dialog; a product = its edit dialog */
    const [editing, setEditing] = useState<Product | 'new' | null>(null)

    const list = products ?? []
    const nextSortOrder = list.reduce((max, p) => Math.max(max, p.sortOrder), 0) + 1

    return (
        <>
            <PageHeader
                eyebrow="Administration"
                title="Products"
                description="The products and platforms you deliver (Acterys, BPP, Microsoft Fabric …). They label knowledge, library assets and clients, filter Copilot searches, and seed the milestones of BRDs."
                actions={
                    <Button variant="solid" size="sm" icon={<AddIcon />} onClick={() => setEditing('new')}>
                        Add product
                    </Button>
                }
            />
            <Card bodyClass="p-0">
                {error && !products ? (
                    <ErrorState message={error} onRetry={() => void refresh()} />
                ) : (
                    <Loading loading={loading && !products} message="Loading products…">
                        {list.length === 0 ? (
                            <EmptyState
                                icon={navigationIcon.products}
                                title="No products yet"
                                description="Add the products you deliver so content and clients can be labelled with them."
                                action={
                                    <Button
                                        size="sm"
                                        variant="solid"
                                        icon={<AddIcon />}
                                        onClick={() => setEditing('new')}
                                    >
                                        Add product
                                    </Button>
                                }
                            />
                        ) : (
                            <div className="overflow-x-auto">
                                <Table hoverable className={validating ? 'opacity-70 transition-opacity' : undefined}>
                                    <THead>
                                        <Tr>
                                            <Th>Product</Th>
                                            <Th>Code</Th>
                                            <Th className="min-w-[240px]">Description</Th>
                                            <Th className="text-right">Milestones</Th>
                                            <Th className="text-right">Order</Th>
                                            <Th>Status</Th>
                                            <Th>
                                                <span className="sr-only">Actions</span>
                                            </Th>
                                        </Tr>
                                    </THead>
                                    <TBody>
                                        {list.map((product) => (
                                            <Tr key={product.id}>
                                                <Td className="whitespace-nowrap">
                                                    <ProductTag productId={product.id} products={list} />
                                                </Td>
                                                <Td>
                                                    <code className="rounded-md bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                                                        {product.code}
                                                    </code>
                                                </Td>
                                                <Td className="text-sm text-gray-600 dark:text-gray-300">
                                                    <span className="line-clamp-2">{product.description || '—'}</span>
                                                </Td>
                                                <Td className="text-right tabular-nums">
                                                    {product.milestoneTemplate.length}
                                                </Td>
                                                <Td className="text-right tabular-nums">{product.sortOrder}</Td>
                                                <Td>
                                                    {product.active ? (
                                                        <Tag className="border-transparent bg-success-subtle text-success">
                                                            Active
                                                        </Tag>
                                                    ) : (
                                                        <Tag className="border-transparent bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                                                            Inactive
                                                        </Tag>
                                                    )}
                                                </Td>
                                                <Td className="text-right">
                                                    <Tooltip title="Edit product">
                                                        <Button
                                                            size="xs"
                                                            variant="plain"
                                                            icon={<EditIcon />}
                                                            aria-label={`Edit ${product.name}`}
                                                            onClick={() => setEditing(product)}
                                                        />
                                                    </Tooltip>
                                                </Td>
                                            </Tr>
                                        ))}
                                    </TBody>
                                </Table>
                            </div>
                        )}
                    </Loading>
                )}
            </Card>
            <p className="mt-3 text-xs text-gray-500">
                Products can’t be deleted because existing knowledge and BRDs refer to them — make one inactive to stop
                offering it.
            </p>

            {editing && (
                <ProductDialog
                    product={editing === 'new' ? null : editing}
                    nextSortOrder={nextSortOrder}
                    onClose={() => setEditing(null)}
                />
            )}
        </>
    )
}
