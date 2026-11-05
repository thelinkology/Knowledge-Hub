import type { Metadata } from 'next'
import { requirePagePermission } from '@/server/actions/auth'
import UsersSWRProvider from '@/components/admin/users/UsersSWRProvider'
import UsersClientPage from '@/components/admin/users/UsersClientPage'

export const metadata: Metadata = { title: 'Users & roles' }

export default async function UsersPage() {
    await requirePagePermission('users.manage')
    return (
        <UsersSWRProvider>
            <UsersClientPage />
        </UsersSWRProvider>
    )
}
