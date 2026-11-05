'use client'

import Link from 'next/link'
import Table from '@/components/ui/Table'
import LinkButton from '@/components/ui/LinkButton'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import Loading from '@/components/shared/Loading'
import { BrdAudienceTag, BrdStatusTag } from './BrdTags'
import navigationIcon, { EditIcon, PreviewIcon } from '@/configs/icons.config'
import { getBrdEditPath, getBrdPath, getClientPath, getIntakePath } from '@/configs/app.config'
import { useSWRBrds } from '@/services/brds'
import { tryGetErrorMessage } from '@/utils/errors'
import { formatDateTime, fromNow } from '@/utils/dates'
import classNames from '@/utils/classNames'
import type { ReactNode } from 'react'
import type { Audience } from '@/@types/shared/PublishStatusOptions'

const { THead, TBody, Tr, Th, Td } = Table

interface BrdListProps {
    /** Only this intake's BRDs (the intake page) */
    intakeId?: string
    /** Only this client's BRDs (the client's BRDs tab) */
    clientId?: string
    audience?: Audience
    /** Replaces the default empty state's description / action */
    emptyDescription?: ReactNode
    emptyAction?: ReactNode
    className?: string
}

/**
 * BRDs (customer-facing and internal) with their status, client, intake and last update, and links to
 * read or edit each one. Page-local list: reads SWR directly (key /brds?…).
 */
export default function BrdList({
    intakeId,
    clientId,
    audience,
    emptyDescription,
    emptyAction,
    className,
}: BrdListProps) {
    const { data, error, isLoading, mutate } = useSWRBrds({ intakeId, clientId, audience })
    const brds = data ?? []
    const filtered = !!audience

    if (error && !data) {
        return (
            <ErrorState
                className={className}
                title="Couldn’t load the BRDs"
                message={`${tryGetErrorMessage(error)} Check your connection and try again.`}
                onRetry={() => void mutate()}
            />
        )
    }

    return (
        <Loading loading={isLoading && !data} message="Loading BRDs…" className={className}>
            {brds.length === 0 ? (
                <EmptyState
                    className={className}
                    icon={navigationIcon.brd}
                    title={
                        filtered
                            ? 'No BRDs of this kind'
                            : intakeId
                              ? 'No BRDs for this intake yet'
                              : clientId
                                ? 'No BRDs for this client yet'
                                : 'No BRDs yet'
                    }
                    description={
                        emptyDescription ??
                        (filtered
                            ? 'Try another filter, or show all BRDs.'
                            : intakeId
                              ? 'Generate them from this intake: a customer-facing BRD and an internal delivery brief.'
                              : 'BRDs are generated from a discovery intake. Complete an intake, then generate its BRDs.')
                    }
                    action={emptyAction}
                />
            ) : (
                <div className={classNames('overflow-x-auto', className)}>
                    <Table hoverable>
                        <THead>
                            <Tr>
                                <Th>Document</Th>
                                <Th>Status</Th>
                                {!clientId && <Th>Client</Th>}
                                {!intakeId && <Th>Intake</Th>}
                                <Th>Updated</Th>
                                <Th>
                                    <span className="sr-only">Actions</span>
                                </Th>
                            </Tr>
                        </THead>
                        <TBody>
                            {brds.map((brd) => (
                                <Tr key={brd.id}>
                                    <Td className="min-w-56">
                                        <Link
                                            href={getBrdPath(brd.id)}
                                            className="font-semibold text-gray-900 hover:text-primary dark:text-gray-100"
                                        >
                                            {brd.title}
                                        </Link>
                                        <div className="mt-1">
                                            <BrdAudienceTag audience={brd.audience} />
                                        </div>
                                    </Td>
                                    <Td>
                                        <BrdStatusTag status={brd.status} />
                                    </Td>
                                    {!clientId && (
                                        <Td className="whitespace-nowrap">
                                            <Link
                                                href={getClientPath(brd.clientId, 'brds')}
                                                className="hover:text-primary"
                                            >
                                                {brd.clientName || 'Client'}
                                            </Link>
                                        </Td>
                                    )}
                                    {!intakeId && (
                                        <Td>
                                            {brd.intakeId ? (
                                                <Link href={getIntakePath(brd.intakeId)} className="hover:text-primary">
                                                    {brd.intakeTitle ?? 'Intake'}
                                                </Link>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </Td>
                                    )}
                                    <Td className="whitespace-nowrap">
                                        <span title={formatDateTime(brd.updatedAt)}>{fromNow(brd.updatedAt)}</span>
                                    </Td>
                                    <Td className="whitespace-nowrap text-right">
                                        <div className="flex justify-end gap-1">
                                            <LinkButton
                                                size="xs"
                                                variant="plain"
                                                href={getBrdPath(brd.id)}
                                                icon={<PreviewIcon />}
                                                aria-label={`View ${brd.title}`}
                                            >
                                                View
                                            </LinkButton>
                                            <LinkButton
                                                size="xs"
                                                variant="plain"
                                                href={getBrdEditPath(brd.id)}
                                                icon={<EditIcon />}
                                                aria-label={`Edit ${brd.title}`}
                                            >
                                                Edit
                                            </LinkButton>
                                        </div>
                                    </Td>
                                </Tr>
                            ))}
                        </TBody>
                    </Table>
                </div>
            )}
        </Loading>
    )
}
