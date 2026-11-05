import Link from 'next/link'
import { ForwardIcon } from '@/configs/icons.config'
import { getBrowseHref } from './browseParams'
import { productThemeClass } from '@/@types/products/ProductThemeOptions'
import classNames from '@/utils/classNames'
import type { Product } from '@/@types/products/Product'

interface ProductCardsProps {
    products: Product[]
    className?: string
}

/** "Browse by product": one card per active product, opening the knowledge browser filtered to it */
export default function ProductCards({ products, className }: ProductCardsProps) {
    const active = products
        .filter((p) => p.active)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    if (!active.length) return null
    return (
        <ul className={classNames('grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', className)}>
            {active.map((product) => (
                <li key={product.id} className={productThemeClass(product.theme)}>
                    <Link
                        href={getBrowseHref({ product: product.id })}
                        className="group flex h-full overflow-hidden rounded-2xl border border-gray-200 bg-white transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-primary dark:border-gray-700 dark:bg-gray-800"
                    >
                        <span className="product-bar w-1.5 shrink-0" aria-hidden />
                        <span className="flex min-w-0 flex-1 flex-col gap-1 p-4">
                            <span className="product-accent flex items-center justify-between gap-2 font-semibold">
                                {product.name}
                                <ForwardIcon
                                    aria-hidden
                                    className="shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                                />
                            </span>
                            {product.description && (
                                <span className="line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                                    {product.description}
                                </span>
                            )}
                        </span>
                    </Link>
                </li>
            ))}
        </ul>
    )
}
