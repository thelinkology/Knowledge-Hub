import { productThemeClass } from '@/@types/products/ProductThemeOptions'
import classNames from '@/utils/classNames'
import type { Product } from '@/@types/products/Product'

/** "Microsoft Fabric" → "MF", "Acterys" → "AC", "BPP" → "BPP" */
export function productInitials(name: string) {
    const words = name.trim().split(/\s+/).filter(Boolean)
    if (!words.length) return '?'
    if (words.length === 1) {
        const word = words[0]
        return (word.length <= 3 && word === word.toUpperCase() ? word : word.slice(0, 2)).toUpperCase()
    }
    return words
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
}

interface ProductLogoProps {
    product: Pick<Product, 'name' | 'theme' | 'logoUrl'>
    /** Height in px (the logo keeps its proportions; the monogram is square) */
    size?: number
    className?: string
}

/** A product's logo, or — until one is uploaded — a monogram tile in the product's colour */
export default function ProductLogo({ product, size = 40, className }: ProductLogoProps) {
    if (product.logoUrl) {
        return (
            <img
                src={product.logoUrl}
                alt={`${product.name} logo`}
                style={{ height: size, maxWidth: size * 3 }}
                className={classNames('w-auto object-contain', className)}
                loading="lazy"
                decoding="async"
            />
        )
    }
    return (
        <span
            aria-hidden
            style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
            className={classNames(
                'product-tag inline-flex shrink-0 items-center justify-center rounded-xl font-bold tracking-tight',
                productThemeClass(product.theme),
                className,
            )}
        >
            {productInitials(product.name)}
        </span>
    )
}
