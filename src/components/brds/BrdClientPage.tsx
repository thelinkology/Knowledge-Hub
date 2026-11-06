'use client'

import Button from '@/components/ui/Button'
import LinkButton from '@/components/ui/LinkButton'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import ErrorState from '@/components/shared/ErrorState'
import Loading from '@/components/shared/Loading'
import BrdDocument from './BrdDocument'
import { CopyIcon, DownloadIcon, EditIcon, PrintIcon } from '@/configs/icons.config'
import { brdsPath, getBrdEditPath, getClientPath } from '@/configs/app.config'
import { useBrdStore } from '@/stores/BrdStores'
import { brdFileName, composeBrdMarkdown } from '@/utils/brd'
import { usePageBreadcrumbs } from '@/utils/hooks/useBreadcrumbs'
import type { Brd } from '@/@types/brds/Brd'

interface BrdClientPageProps {
    brdId: string
}

/** The whole document as Markdown, under its title (what Download and Copy hand over) */
const fullMarkdown = (brd: Brd) => composeBrdMarkdown(brd, { includeTitle: true })

/** Reading one BRD: print / save as PDF, download or copy the Markdown, edit */
export default function BrdClientPage({ brdId }: BrdClientPageProps) {
    const brd = useBrdStore(brdId, (s) => s.data)
    const error = useBrdStore(brdId, (s) => s.error)
    const refresh = useBrdStore(brdId, (s) => s.refresh)

    usePageBreadcrumbs([
        { label: 'BRDs', href: brdsPath },
        ...(brd ? [{ label: brd.clientName, href: getClientPath(brd.clientId, 'brds') }] : []),
        { label: brd?.title ?? 'BRD' },
    ])

    if (!brd)
        return error ? (
            <ErrorState message={error} onRetry={() => void refresh()} />
        ) : (
            <Loading loading message="Opening the BRD…" />
        )

    const download = () => {
        const blob = new Blob([fullMarkdown(brd)], { type: 'text/markdown;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = brdFileName(brd.title)
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
    }

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(fullMarkdown(brd))
            toastSuccess('Markdown copied.', { duration: 3000 })
        } catch (e) {
            toastError('Couldn’t copy. Your browser blocked the clipboard — use Download Markdown instead.', e)
        }
    }

    return (
        <>
            <div className="no-print mb-6 flex flex-wrap justify-end gap-2">
                <Button size="sm" variant="plain" icon={<PrintIcon />} onClick={() => window.print()}>
                    Print / Save as PDF
                </Button>
                <Button size="sm" variant="plain" icon={<DownloadIcon />} onClick={download}>
                    Download Markdown
                </Button>
                <Button size="sm" variant="plain" icon={<CopyIcon />} onClick={() => void copy()}>
                    Copy Markdown
                </Button>
                <LinkButton size="sm" variant="solid" href={getBrdEditPath(brdId)} icon={<EditIcon />}>
                    Edit
                </LinkButton>
            </div>
            <BrdDocument brd={brd} />
        </>
    )
}
