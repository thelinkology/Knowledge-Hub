'use client'

import { useState } from 'react'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import ClientsPicker from '@/components/shared/ClientsPicker'
import { FormItem } from '@/components/ui/Form'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import { apiSetUserClients } from '@/services/users'
import { useUsersStore } from '@/stores/AdminStores'
import type { UserAccount } from '@/@types/users/UserAccount'

/** Assigns someone to clients: a viewer then reads shared knowledge plus those clients' knowledge */
export default function UserClientsDialog({ user, onClose }: { user: UserAccount; onClose: () => void }) {
    const refresh = useUsersStore((s) => s.refresh)
    const [clientIds, setClientIds] = useState(() => user.clients.map((c) => c.id))
    const [saving, setSaving] = useState(false)
    const viewer = user.role === 'viewer'

    const onConfirm = async () => {
        setSaving(true)
        try {
            await apiSetUserClients(user.id, { clientIds })
            toastSuccess(`${user.displayName}’s clients are saved.`)
            await refresh()
            onClose()
        } catch (error) {
            toastError(`Couldn’t save ${user.displayName}’s clients.`, error)
        } finally {
            setSaving(false)
        }
    }

    return (
        <ConfirmDialog
            isOpen
            onClose={onClose}
            type="info"
            title={`Clients for ${user.displayName}`}
            confirmText="Save"
            onConfirm={onConfirm}
            loading={saving}
        >
            <FormItem label="Clients" htmlFor="user-clients" className="mb-3">
                <ClientsPicker inputId="user-clients" value={clientIds} onChange={setClientIds} />
            </FormItem>
            <p className="text-sm text-gray-500">
                {viewer
                    ? clientIds.length
                        ? 'They’ll read shared knowledge plus the knowledge of these clients. Nothing else.'
                        : 'With no clients, they read shared knowledge only.'
                    : 'Editors and administrators read every client’s knowledge anyway; this only records who works with whom. It takes effect if they become a viewer.'}
            </p>
        </ConfirmDialog>
    )
}
