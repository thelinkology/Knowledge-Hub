import type { Metadata } from 'next'
import { requirePagePermission } from '@/server/actions/auth'
import ProductsSWRProvider from '@/components/admin/products/ProductsSWRProvider'
import ProductsClientPage from '@/components/admin/products/ProductsClientPage'

export const metadata: Metadata = { title: 'Products' }

export default async function ProductsPage() {
    await requirePagePermission('settings.manage')
    return (
        <ProductsSWRProvider>
            <ProductsClientPage />
        </ProductsSWRProvider>
    )
}
