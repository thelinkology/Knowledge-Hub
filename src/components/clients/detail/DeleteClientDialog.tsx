'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { apiDeleteClient } from '@/services/clients'
import { clientsPath } from '@/configs/app.config'
import type { Client } from '@/@types/clients/Client'

const plural = (count: number, one: string, many: string) => `${count.toLocaleString()} ${count === 1 ? one : many}`

interface DeleteClientDialogProps {
    client: Client
    isOpen: boolean
    onClose: () => void
}

/** Deletes the client and everything that belongs only to them, then goes back to the clients list */
export default function DeleteClientDialog({ client, isOpen, onClose }: DeleteClientDialogProps) {
    const router = useRouter()
    const [deleting, setDeleting] = useState(false)
    const { articles, assets, intakes, brds } = client.counts

    const remove = async () => {
        setDeleting(true)
        try {
            await apiDeleteClient(client.id)
            toastSuccess(`${client.name} deleted.`)
            router.push(clientsPath)
        } catch (error) {
            toastError('The client couldn’t be deleted.', error)
            setDeleting(false)
        }
    }

    return (
        <ConfirmDialog
            isOpen={isOpen}
            onClose={onClose}
            type="danger"
            title={`Delete ${client.name}?`}
            confirmText="Delete client permanently"
            onConfirm={() => void remove()}
            loading={deleting}
        >
            <p>
                Everything that belongs only to this client is deleted with it:{' '}
                <strong>
                    {plural(articles, 'article', 'articles')}, {plural(assets, 'library asset', 'library assets')},{' '}
                    {plural(intakes, 'intake', 'intakes')} and {plural(brds, 'BRD', 'BRDs')}
                </strong>
                . Shared knowledge isn’t affected.
            </p>
            <p className="mt-2 font-semibold">This can’t be undone.</p>
        </ConfirmDialog>
    )
}
