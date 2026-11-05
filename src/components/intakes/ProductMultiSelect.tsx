'use client'

import Select from '@/components/ui/Select'
import type { Product } from '@/@types/products/Product'

interface ProductMultiSelectProps {
    inputId: string
    products: Product[] | undefined
    value: string[]
    onChange: (productIds: string[]) => void
    invalid?: boolean
    'aria-describedby'?: string
}

type ProductOption = { value: string; label: string }

/** Picks the products in scope. Inactive products are offered only when already chosen. */
export default function ProductMultiSelect({
    inputId,
    products,
    value,
    onChange,
    invalid,
    'aria-describedby': describedBy,
}: ProductMultiSelectProps) {
    const options: ProductOption[] = (products ?? [])
        .filter((p) => p.active || value.includes(p.id))
        .map((p) => ({ value: p.id, label: p.active ? p.name : `${p.name} (inactive)` }))
    return (
        <Select<ProductOption, true>
            inputId={inputId}
            isMulti
            isLoading={!products}
            options={options}
            value={options.filter((o) => value.includes(o.value))}
            onChange={(selected) => onChange(selected.map((o) => o.value))}
            placeholder="No specific products"
            invalid={invalid}
            aria-describedby={describedBy}
            closeMenuOnSelect={false}
        />
    )
}
