'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import MarkdownContent from '@/components/shared/MarkdownContent'
import { BrdAudienceTag, BrdStatusTag } from './BrdTags'
import { InfoIcon, LockedIcon } from '@/configs/icons.config'
import { getClientPath, getIntakePath } from '@/configs/app.config'
import { composeBrdMarkdown } from '@/utils/brd'
import { getOutline } from '@/utils/articleValidation'
import { formatDate } from '@/utils/dates'
import classNames from '@/utils/classNames'
import type { Brd } from '@/@types/brds/Brd'
import type { Audience } from '@/@types/shared/PublishStatusOptions'

export type BrdDocumentData = Pick<
    Brd,
    | 'title'
    | 'audience'
    | 'status'
    | 'body'
    | 'milestones'
    | 'clientId'
    | 'clientName'
    | 'intakeId'
    | 'intakeTitle'
    | 'updatedAt'
    | 'updatedByName'
>

/** Says plainly who the document is for. The internal banner prints too, so paper copies stay marked. */
export function BrdAudienceBanner({
    audience,
    clientName,
    className,
}: {
    audience: Audience
    clientName: string
    className?: string
}) {
    const customer = audience === 'customer'
    return (
        <div
            role="note"
            className={classNames(
                'flex items-start gap-3 rounded-2xl border-l-4 px-4 py-3 text-sm',
                customer
                    ? 'no-print border-info bg-info-subtle text-gray-800 dark:text-gray-100'
                    : 'border-error bg-error-subtle text-gray-800 dark:text-gray-100',
                className,
            )}
        >
            <span className={classNames('mt-0.5 text-lg', customer ? 'text-info' : 'text-error')} aria-hidden>
                {customer ? <InfoIcon /> : <LockedIcon />}
            </span>
            <span>
                <strong className="font-semibold">{customer ? 'Customer-facing' : 'Internal – do not send'}</strong>
                {customer
                    ? ` — written to share with ${clientName || 'the client'}. Gotchas, internal guidance, internal articles and discovery notes are never included.`
                    : ` — the delivery team’s brief, with gotchas, internal guidance and links to internal material. Share the customer BRD with ${clientName || 'the client'} instead.`}
            </span>
        </div>
    )
}

interface BrdDocumentProps {
    brd: BrdDocumentData
    /** The editor's preview: no outline or navigation links */
    preview?: boolean
}

/** A BRD as a document (body + the milestones section), with "In this document" on wide screens */
export default function BrdDocument({ brd, preview }: BrdDocumentProps) {
    const { title, audience, body, milestones } = brd
    const markdown = useMemo(
        () => composeBrdMarkdown({ title, audience, body, milestones }),
        [title, audience, body, milestones],
    )
    const outline = useMemo(() => getOutline(markdown), [markdown])

    return (
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_220px]">
            <article className="print-full min-w-0 max-w-4xl">
                <BrdAudienceBanner audience={brd.audience} clientName={brd.clientName} className="mb-6" />
                <div className="mb-3 flex flex-wrap items-center gap-2">
                    <BrdAudienceTag audience={brd.audience} />
                    <BrdStatusTag status={brd.status} />
                </div>
                <h1 className="text-3xl leading-tight md:text-4xl">{brd.title || 'Untitled BRD'}</h1>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-gray-200 pb-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    {preview ? (
                        <span>{brd.clientName}</span>
                    ) : (
                        <Link href={getClientPath(brd.clientId, 'brds')} className="hover:text-primary">
                            {brd.clientName}
                        </Link>
                    )}
                    {brd.intakeId && brd.intakeTitle && (
                        <span>
                            From intake{' '}
                            {preview ? (
                                brd.intakeTitle
                            ) : (
                                <Link href={getIntakePath(brd.intakeId)} className="hover:text-primary">
                                    {brd.intakeTitle}
                                </Link>
                            )}
                        </span>
                    )}
                    <span>
                        Updated {formatDate(brd.updatedAt)}
                        {brd.updatedByName && ` by ${brd.updatedByName}`}
                    </span>
                </div>
                <div className="mt-6">
                    {markdown.trim() ? (
                        <MarkdownContent headingIds>{markdown}</MarkdownContent>
                    ) : (
                        <p className="text-gray-500">Nothing written yet.</p>
                    )}
                </div>
            </article>

            <aside className="no-print hidden xl:block" aria-label="In this document">
                {!preview && outline.length > 0 && (
                    <div className="article-outline sticky top-20">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                            In this document
                        </div>
                        <ul className="space-y-1 text-sm">
                            {outline.map((heading) => (
                                <li key={heading.id} className={heading.level === 3 ? 'pl-3' : undefined}>
                                    <a
                                        href={`#${heading.id}`}
                                        className="block text-gray-600 hover:text-primary dark:text-gray-400"
                                    >
                                        {heading.text}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </aside>
        </div>
    )
}
