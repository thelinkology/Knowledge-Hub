'use client'

import { useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import Loading from '@/components/shared/Loading'
import ErrorState from '@/components/shared/ErrorState'
import MarkdownContent from '@/components/shared/MarkdownContent'
import { RestoreIcon } from '@/configs/icons.config'
import { apiRestoreRevision, useSWRArticleRevisions } from '@/services/knowledge'
import { formatDateTime } from '@/utils/dates'
import { tryGetErrorMessage } from '@/utils/errors'
import classNames from '@/utils/classNames'
import type { ArticleEditorData } from '@/@types/knowledge/ArticleEditor'

interface RevisionHistoryDialogProps {
    articleId: string
    currentVersion: number
    isOpen: boolean
    onClose: () => void
    /** The editor data after a restore (the editor resets its form to it) */
    onRestored: (data: ArticleEditorData) => void
    /** Restoring is blocked while the form has unsaved changes */
    dirty: boolean
}

/** Every saved version of the article; pick one to read it, and restore it as a new version */
export default function RevisionHistoryDialog({
    articleId,
    currentVersion,
    isOpen,
    onClose,
    onRestored,
    dirty,
}: RevisionHistoryDialogProps) {
    const revisions = useSWRArticleRevisions(isOpen ? articleId : null)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [restoring, setRestoring] = useState(false)
    const list = revisions.data ?? []
    const selected = list.find((r) => r.id === selectedId) ?? list[0]

    const restore = async () => {
        if (!selected) return
        setRestoring(true)
        try {
            onRestored(await apiRestoreRevision(articleId, selected.id))
            toastSuccess(`Version ${selected.version} restored as a new version.`)
            void revisions.mutate()
            onClose()
        } catch (error) {
            toastError(`Couldn’t restore that version. ${tryGetErrorMessage(error)}`)
        } finally {
            setRestoring(false)
        }
    }

    return (
        <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={1000}>
            <h5 className="mb-4">Version history</h5>
            {revisions.error ? (
                <ErrorState message={tryGetErrorMessage(revisions.error)} onRetry={() => void revisions.mutate()} />
            ) : (
                <Loading loading={revisions.isLoading} message="Loading versions…">
                    <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                        <ul className="max-h-[60vh] space-y-1 overflow-y-auto" aria-label="Versions">
                            {list.map((revision) => (
                                <li key={revision.id}>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedId(revision.id)}
                                        aria-pressed={selected?.id === revision.id}
                                        className={classNames(
                                            'w-full rounded-lg px-3 py-2 text-left text-sm',
                                            selected?.id === revision.id
                                                ? 'bg-primary-subtle text-primary'
                                                : 'hover:bg-gray-100 dark:hover:bg-gray-700',
                                        )}
                                    >
                                        <span className="block font-semibold">
                                            Version {revision.version}
                                            {revision.version === currentVersion && ' (current)'}
                                        </span>
                                        <span className="block text-xs text-gray-500">
                                            {formatDateTime(revision.createdAt)}
                                            {revision.savedByName && ` · ${revision.savedByName}`}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                            {selected ? (
                                <>
                                    <h4 className="mb-1">{selected.title}</h4>
                                    {selected.summary && <p className="mb-4 text-gray-500">{selected.summary}</p>}
                                    <MarkdownContent>{selected.body || '_Empty_'}</MarkdownContent>
                                </>
                            ) : (
                                <p className="text-sm text-gray-500">No versions yet.</p>
                            )}
                        </div>
                    </div>
                </Loading>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                {dirty && (
                    <span className="mr-auto text-xs text-warning">Save or discard your changes to restore.</span>
                )}
                <Button onClick={onClose}>Close</Button>
                <Button
                    variant="solid"
                    icon={<RestoreIcon />}
                    disabled={!selected || selected.version === currentVersion || dirty}
                    loading={restoring}
                    onClick={() => void restore()}
                >
                    Restore this version
                </Button>
            </div>
        </Dialog>
    )
}
