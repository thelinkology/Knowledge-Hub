'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import ProductLogo from '@/components/shared/ProductLogo'
import { ForwardIcon, ImageIcon } from '@/configs/icons.config'
import { getBrowseHref } from './browseParams'
import { uploadImage } from '@/services/media'
import ProductCardImage from './ProductCardImage'
import { apiUpdateProduct } from '@/services/clients'
import { useProductsStore } from '@/stores/AppStores'
import useSession from '@/utils/hooks/useSession'
import { IMAGE_ACCEPT } from '@/utils/fileTypes'
import { tryGetErrorMessage } from '@/utils/errors'
import classNames from '@/utils/classNames'
import type { Product, ProductInput } from '@/@types/products/Product'

interface ProductCardsProps {
    products: Product[]
    className?: string
}

const toInput = (product: Product, logoUrl: string): ProductInput => ({
    code: product.code,
    name: product.name,
    description: product.description,
    theme: product.theme,
    logoUrl,
    milestoneTemplate: product.milestoneTemplate,
    active: product.active,
    sortOrder: product.sortOrder,
})

/** Administrators: upload the card's image right from the card (also in Administration → Products) */
function CardImageButton({ product }: { product: Product }) {
    const fileInput = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)
    const setData = useProductsStore((s) => s.setData)
    const refresh = useProductsStore((s) => s.refresh)

    const upload = async (file: File) => {
        setUploading(true)
        try {
            const media = await uploadImage(file)
            const saved = await apiUpdateProduct(product.id, toInput(product, media.url))
            const current = useProductsStore.getState().data
            if (current) setData(current.map((p) => (p.id === saved.id ? saved : p)))
            void refresh()
            toastSuccess(`${product.name}’s image is updated.`)
        } catch (error) {
            toastError(tryGetErrorMessage(error), error)
        } finally {
            setUploading(false)
        }
    }

    return (
        <>
            <input
                ref={fileInput}
                type="file"
                accept={IMAGE_ACCEPT}
                className="sr-only"
                tabIndex={-1}
                aria-hidden
                onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void upload(file)
                    e.target.value = ''
                }}
            />
            <Button
                type="button"
                size="xs"
                icon={<ImageIcon />}
                loading={uploading}
                aria-label={`${product.logoUrl ? 'Change' : 'Add'} the image of ${product.name}`}
                title={product.logoUrl ? 'Change image' : 'Add image'}
                className="absolute right-3 bottom-3 opacity-80 group-hover/card:opacity-100 focus-visible:opacity-100"
                onClick={() => fileInput.current?.click()}
            />
        </>
    )
}

/**
 * "Browse by product" (Microsoft Learn-style tiles): name and description on top, the product's image
 * centred below. One card per active product, opening the knowledge browser filtered to it.
 * Administrators can add or change the image from the card.
 */
export default function ProductCards({ products, className }: ProductCardsProps) {
    const { can } = useSession()
    const canEdit = can('settings.manage')
    const active = products
        .filter((p) => p.active)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    if (!active.length) return null
    return (
        <ul className={classNames('grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', className)}>
            {active.map((product) => (
                <li key={product.id} className="group/card relative">
                    <Link
                        href={getBrowseHref({ product: product.id })}
                        className="group flex h-full min-h-60 flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-xs transition hover:border-primary hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary dark:border-gray-700 dark:bg-gray-800"
                    >
                        <span className="flex items-start justify-between gap-2 text-base font-semibold text-gray-900 group-hover:text-primary dark:text-gray-100">
                            {product.name}
                            <ForwardIcon
                                aria-hidden
                                className="mt-1 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transition-none"
                            />
                        </span>
                        {product.description && (
                            <span className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                                {product.description}
                            </span>
                        )}
                        <span className="mt-auto flex h-36 items-center justify-center pt-4">
                            {product.logoUrl ? (
                                <ProductCardImage src={product.logoUrl} />
                            ) : (
                                <ProductLogo product={product} size={64} />
                            )}
                        </span>
                    </Link>
                    {canEdit && <CardImageButton product={product} />}
                </li>
            ))}
        </ul>
    )
}
