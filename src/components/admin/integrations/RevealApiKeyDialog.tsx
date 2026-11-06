'use client'

import { useEffect, useState } from 'react'
import Alert from '@/components/ui/Alert'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import Loading from '@/components/shared/Loading'
import CopyField from './CopyField'
import { apiRevealApiKey } from '@/services/integrations'
import { tryGetErrorMessage } from '@/utils/errors'
import type { ApiKey } from '@/@types/integrations/ApiKey'

/** Shows a key again, to copy (each time is recorded in the audit log). The key is never kept in the page. */
export default function RevealApiKeyDialog({ apiKey, onClose }: { apiKey: ApiKey; onClose: () => void }) {
    const [secret, setSecret] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let current = true
        apiRevealApiKey(apiKey.id)
            .then((result) => current && setSecret(result.secret))
            .catch((e) => current && setError(tryGetErrorMessage(e)))
        return () => {
            current = false
        }
    }, [apiKey.id])

    return (
        <ConfirmDialog
            isOpen
            onClose={onClose}
            type="info"
            title={apiKey.name}
            confirmText="Done"
            onConfirm={onClose}
            width={600}
        >
            {error ? (
                <Alert type="danger" showIcon>
                    {error}
                </Alert>
            ) : (
                <Loading loading={!secret} message="Getting the key…">
                    <div className="form-label mb-1">API key</div>
                    <CopyField value={secret ?? ''} what="the API key" />
                    <p className="mt-3 text-xs text-gray-500">
                        Treat it like a password. Showing a key is recorded in the audit log.
                    </p>
                </Loading>
            )}
        </ConfirmDialog>
    )
}
