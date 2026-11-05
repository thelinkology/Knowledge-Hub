import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import BrdSWRProvider from '@/components/brds/BrdSWRProvider'
import BrdClientPage from '@/components/brds/BrdClientPage'
import { getBrd } from '@/server/actions/brds'
import { requirePagePermission } from '@/server/actions/auth'
import { isNotFound } from '@/server/utils/errors'
import { isUuid } from '@/utils/ids'

export const metadata: Metadata = { title: 'BRD' }

interface BrdPageProps {
    params: Promise<{ brdId: string }>
}

export default async function BrdPage({ params }: BrdPageProps) {
    await requirePagePermission('requirements.manage')
    const { brdId } = await params
    if (!isUuid(brdId)) notFound()

    let brd
    try {
        brd = await getBrd(brdId)
    } catch (error) {
        if (isNotFound(error)) notFound()
        throw error
    }

    return (
        <BrdSWRProvider brdId={brdId} brd={brd}>
            <BrdClientPage brdId={brdId} />
        </BrdSWRProvider>
    )
}
