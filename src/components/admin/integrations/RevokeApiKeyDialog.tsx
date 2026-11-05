'use client'

import { useState } from 'react'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { apiRevokeApiKey } from '@/services/integrations'
import { useApiKeysStore } from '@/stores/SettingsStores'
import type { ApiKey } from '@/@types/integrations/ApiKey'

interface RevokeApiKeyDialogProps {
    apiKey: ApiKey | null
    onClose: () => void
}

/** Revokes a key for good: agents using it are refused from their next request */
export default function RevokeApiKeyDialog({ apiKey, onClose }: RevokeApiKeyDialogProps) {
    const refresh = useApiKeysStore((s) => s.refresh)
    const [busy, setBusy] = useState(false)

    const revoke = async () => {
        if (!apiKey) return
        setBusy(true)
        try {
            await apiRevokeApiKey(apiKey.id)
            toastSuccess(`“${apiKey.name}” was revoked.`)
            await refresh()
            onClose()
        } catch (error) {
            toastError('The key couldn’t be revoked.', error)
        } finally {
            setBusy(false)
        }
    }

    return (
        <ConfirmDialog
            isOpen={!!apiKey}
            onClose={onClose}
            type="danger"
            title={`Revoke “${apiKey?.name ?? 'this key'}”?`}
            confirmText="Revoke key"
            onConfirm={() => void revoke()}
            loading={busy}
        >
            <p>
                Agents using this key stop getting answers from Knowledge Hub straight away (their requests are refused
                with 401). This can’t be undone — to reconnect them, create a new key and update the connection in
                Copilot Studio.
            </p>
        </ConfirmDialog>
    )
}
