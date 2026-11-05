'use client'

import { useState } from 'react'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import { apiSetUserRole } from '@/services/users'
import { useUsersStore } from '@/stores/AdminStores'
import { roleLabel, type Role } from '@/@types/auth/Roles'
import type { UserAccount } from '@/@types/users/UserAccount'

interface ChangeRoleDialogProps {
    user: UserAccount | null
    role: Role | null
    onClose: () => void
}

const roleConsequence: Record<Role, string> = {
    viewer: 'Viewers read published knowledge, the library and client pages. They can’t edit anything.',
    editor: 'Editors write and publish knowledge and library assets, manage clients, and run discovery intakes and BRDs.',
    admin: 'Administrators can also invite people, change roles, edit products and intake rules, and issue Copilot API keys. Only give this to people who run the hub.',
}

/** Confirms a role change, saying what the new role can do. Recorded in the audit log by the server. */
export default function ChangeRoleDialog({ user, role, onClose }: ChangeRoleDialogProps) {
    const refresh = useUsersStore((s) => s.refresh)
    const [saving, setSaving] = useState(false)
    if (!user || !role) return null

    const onConfirm = async () => {
        setSaving(true)
        try {
            await apiSetUserRole(user.id, { role })
            toastSuccess(
                `${user.displayName} is now ${role === 'admin' ? 'an' : 'a'} ${roleLabel[role].toLowerCase()}.`,
            )
            await refresh()
            onClose()
        } catch (error) {
            toastError(`Couldn’t change ${user.displayName}’s role.`, error)
        } finally {
            setSaving(false)
        }
    }

    return (
        <ConfirmDialog
            isOpen
            onClose={onClose}
            type={role === 'admin' ? 'danger' : 'warning'}
            title={`Make ${user.displayName} ${role === 'admin' ? 'an' : 'a'} ${roleLabel[role].toLowerCase()}?`}
            confirmText={`Change to ${roleLabel[role]}`}
            onConfirm={onConfirm}
            loading={saving}
        >
            <p>{roleConsequence[role]}</p>
        </ConfirmDialog>
    )
}
