import Tag from '@/components/ui/Tag'
import navigationIcon from '@/configs/icons.config'
import {
    audienceLabel,
    audienceTagClass,
    publishStatusLabel,
    publishStatusTagClass,
    type Audience,
    type PublishStatus,
} from '@/@types/shared/PublishStatusOptions'
import { articleKindIcon, articleKindLabel, type ArticleKind } from '@/@types/knowledge/ArticleKindOptions'
import { assetKindIcon, assetKindLabel, type AssetKind } from '@/@types/library/Asset'
import { clientStatusLabel, clientStatusTagClass, type ClientStatus } from '@/@types/clients/Client'
import { productThemeClass } from '@/@types/products/ProductThemeOptions'
import type { Product } from '@/@types/products/Product'
import classNames from '@/utils/classNames'

/* Small labelled tags used across knowledge, library, clients and requirements. */

interface TagProps {
    className?: string
}

export function PublishStatusTag({ status, className }: TagProps & { status: PublishStatus }) {
    return <Tag className={classNames(publishStatusTagClass[status], className)}>{publishStatusLabel[status]}</Tag>
}

export function AudienceTag({ audience, className }: TagProps & { audience: Audience }) {
    return <Tag className={classNames(audienceTagClass[audience], className)}>{audienceLabel[audience]}</Tag>
}

export function ArticleKindTag({ kind, className }: TagProps & { kind: ArticleKind }) {
    return (
        <Tag
            className={classNames(
                'gap-1 border-transparent bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
                className,
            )}
            prefix={<span aria-hidden>{navigationIcon[articleKindIcon[kind]]}</span>}
        >
            {articleKindLabel[kind]}
        </Tag>
    )
}

export function AssetKindTag({ kind, className }: TagProps & { kind: AssetKind }) {
    return (
        <Tag
            className={classNames(
                'gap-1 border-transparent bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
                className,
            )}
            prefix={<span aria-hidden>{navigationIcon[assetKindIcon[kind]]}</span>}
        >
            {assetKindLabel[kind]}
        </Tag>
    )
}

export function ClientStatusTag({ status, className }: TagProps & { status: ClientStatus }) {
    return <Tag className={classNames(clientStatusTagClass[status], className)}>{clientStatusLabel[status]}</Tag>
}

/** A product chip in the product's colour. Unknown ids render nothing. */
export function ProductTag({
    productId,
    products,
    className,
}: TagProps & { productId: string | null; products: Product[] | undefined }) {
    const product = productId ? products?.find((p) => p.id === productId) : undefined
    if (!product) return null
    return <Tag className={classNames('product-tag', productThemeClass(product.theme), className)}>{product.name}</Tag>
}

/** Several product chips */
export function ProductTags({
    productIds,
    products,
    className,
}: TagProps & { productIds: string[]; products: Product[] | undefined }) {
    if (!productIds.length) return null
    return (
        <span className={classNames('inline-flex flex-wrap gap-1', className)}>
            {productIds.map((id) => (
                <ProductTag key={id} productId={id} products={products} />
            ))}
        </span>
    )
}

/** Free-form tags (#fabric, #gateway…) */
export function KeywordTags({ tags, className }: TagProps & { tags: string[] }) {
    if (!tags.length) return null
    return (
        <span className={classNames('inline-flex flex-wrap gap-1', className)}>
            {tags.map((tag) => (
                <span
                    key={tag}
                    className="rounded-md bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                >
                    #{tag}
                </span>
            ))}
        </span>
    )
}

/** "Shared" or the client's name, for where a piece of knowledge applies */
export function ScopeLabel({ clientName, className }: TagProps & { clientName: string | null }) {
    return (
        <span className={classNames('text-xs text-gray-500', className)}>
            {clientName ? `Client: ${clientName}` : 'Shared knowledge'}
        </span>
    )
}
