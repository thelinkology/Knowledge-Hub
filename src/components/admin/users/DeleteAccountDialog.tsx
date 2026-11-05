'use client'

import { useState } from 'react'
import Input from '@/components/ui/Input'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { apiDeleteUser } from '@/services/users'
import type { UserAccount } from '@/@types/users/UserAccount'

interface DeleteAccountDialogProps {
    user: UserAccount | null
    onClose: () => void
    onDeleted: () => void
}

/** Deletes an account permanently, confirmed by typing the person's email */
export default function DeleteAccountDialog({ user, onClose, onDeleted }: DeleteAccountDialogProps) {
    const [typed, setTyped] = useState('')
    const [busy, setBusy] = useState(false)
    const confirmWith = user?.email ?? ''
    const matches = !!user && typed.trim().toLowerCase() === confirmWith.toLowerCase()

    const close = () => {
        setTyped('')
        onClose()
    }

    const remove = async () => {
        if (!user || !matches) return
        setBusy(true)
        try {
            await apiDeleteUser(user.id)
            toastSuccess(`${user.displayName}’s account was deleted.`)
            setTyped('')
            onDeleted()
        } catch (error) {
            toastError('The account couldn’t be deleted.', error)
        } finally {
            setBusy(false)
        }
    }

    return (
        <ConfirmDialog
            isOpen={!!user}
            onClose={close}
            type="danger"
            title={`Delete ${user?.displayName ?? 'this'}’s account?`}
            confirmText="Delete permanently"
            onConfirm={remove}
            loading={busy}
            confirmButtonProps={{ disabled: !matches }}
        >
            <p>
                This permanently removes their sign-in and profile. It can’t be undone. Articles, assets and BRDs they
                wrote stay, without an author.
            </p>
            <label htmlFor="delete-confirm-email" className="form-label mt-4 mb-1 block">
                Type <strong className="select-all">{confirmWith}</strong> to confirm
            </label>
            <Input
                id="delete-confirm-email"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoComplete="off"
                spellCheck={false}
            />
        </ConfirmDialog>
    )
}
