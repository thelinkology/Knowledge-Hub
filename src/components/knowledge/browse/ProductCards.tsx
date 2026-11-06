import Link from 'next/link'
import ProductLogo from '@/components/shared/ProductLogo'
import { ForwardIcon } from '@/configs/icons.config'
import { getBrowseHref } from './browseParams'
import classNames from '@/utils/classNames'
import type { Product } from '@/@types/products/Product'

interface ProductCardsProps {
    products: Product[]
    className?: string
}

/**
 * "Browse by product" (Microsoft Learn-style tiles): name and description on top, the product's logo
 * below. One card per active product, opening the knowledge browser filtered to it.
 */
export default function ProductCards({ products, className }: ProductCardsProps) {
    const active = products
        .filter((p) => p.active)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    if (!active.length) return null
    return (
        <ul className={classNames('grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', className)}>
            {active.map((product) => (
                <li key={product.id}>
                    <Link
                        href={getBrowseHref({ product: product.id })}
                        className="group flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-xs transition hover:border-primary hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary dark:border-gray-700 dark:bg-gray-800"
                    >
                        <span className="flex items-start justify-between gap-2 text-base font-semibold text-gray-900 group-hover:text-primary dark:text-gray-100">
                            {product.name}
                            <ForwardIcon
                                aria-hidden
                                className="mt-1 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                            />
                        </span>
                        {product.description && (
                            <span className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                                {product.description}
                            </span>
                        )}
                        <span className="mt-auto pt-6">
                            <ProductLogo product={product} size={40} />
                        </span>
                    </Link>
                </li>
            ))}
        </ul>
    )
}
