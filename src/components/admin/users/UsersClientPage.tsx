'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import Select from '@/components/ui/Select'
import Segment from '@/components/ui/Segment'
import Pagination from '@/components/ui/Pagination'
import Tooltip from '@/components/ui/Tooltip'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import PageHeader from '@/components/shared/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import Loading from '@/components/shared/Loading'
import UserAvatar from '@/components/shared/UserAvatar'
import ChangeRoleDialog from './ChangeRoleDialog'
import DeleteAccountDialog from './DeleteAccountDialog'
import InviteUserDialog from './InviteUserDialog'
import { AddUserIcon, DeleteIcon, EmailIcon, PeopleIcon, SearchIcon } from '@/configs/icons.config'
import { toastError, toastSuccess } from '@/components/ui/toast/toast'
import { apiSendUserSignInLink } from '@/services/users'
import { tryGetErrorMessage } from '@/utils/errors'
import { homePath } from '@/configs/app.config'
import { useUsersStore } from '@/stores/AdminStores'
import { ROLES, roleLabel, type Role } from '@/@types/auth/Roles'
import useSession from '@/utils/hooks/useSession'
import useDebouncedValue from '@/utils/hooks/useDebouncedValue'
import { usePageBreadcrumbs } from '@/utils/hooks/useBreadcrumbs'
import { formatDate } from '@/utils/dates'
import type { UserAccount } from '@/@types/users/UserAccount'
import { USERS_PAGE_SIZE } from '@/constants/app.constant'

const { THead, TBody, Tr, Th, Td } = Table

const ROLE_OPTIONS = ROLES.map((role) => ({ value: role, label: roleLabel[role] }))

const ROLE_FILTERS: { value: Role | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'viewer', label: 'Viewers' },
    { value: 'editor', label: 'Editors' },
    { value: 'admin', label: 'Admins' },
]

/** Search box that updates the store's query after typing pauses */
function UserSearch() {
    const setQuery = useUsersStore((s) => s.setQuery)
    const storeQuery = useUsersStore((s) => s.query.q)
    const [text, setText] = useState(storeQuery)
    const debounced = useDebouncedValue(text.trim(), 350)
    useEffect(() => {
        if (useUsersStore.getState().query.q !== debounced) setQuery({ q: debounced })
    }, [debounced, setQuery])

    return (
        <div className="w-full md:w-80">
            <label htmlFor="user-search" className="sr-only">
                Search users
            </label>
            <Input
                id="user-search"
                size="sm"
                type="search"
                prefix={<SearchIcon className="text-lg text-gray-400" />}
                placeholder="Search by name or email"
                value={text}
                onChange={(e) => setText(e.target.value)}
            />
        </div>
    )
}

/** Administrators: invite people, change roles and remove accounts. Every change is audited. */
export default function UsersClientPage() {
    usePageBreadcrumbs([{ label: 'Home', href: homePath }, { label: 'Users & roles' }])
    const { user: me } = useSession()
    const data = useUsersStore((s) => s.data)
    const loading = useUsersStore((s) => s.loading)
    const validating = useUsersStore((s) => s.validating)
    const error = useUsersStore((s) => s.error)
    const refresh = useUsersStore((s) => s.refresh)
    const query = useUsersStore((s) => s.query)
    const setQuery = useUsersStore((s) => s.setQuery)

    const [roleChange, setRoleChange] = useState<{ user: UserAccount; role: Role } | null>(null)
    const [deleting, setDeleting] = useState<UserAccount | null>(null)
    /** The account a sign-in link is being emailed to */
    const [sendingLinkTo, setSendingLinkTo] = useState<string | null>(null)

    const sendSignInLink = async (account: UserAccount) => {
        setSendingLinkTo(account.id)
        try {
            const { email } = await apiSendUserSignInLink(account.id)
            toastSuccess(`Sign-in link sent to ${email}. It works once, for one hour.`)
        } catch (error) {
            toastError(tryGetErrorMessage(error), error)
        } finally {
            setSendingLinkTo(null)
        }
    }
    const [inviting, setInviting] = useState(false)

    const records = data?.records ?? []
    const filtered = !!query.q || !!query.role

    return (
        <>
            <PageHeader
                eyebrow="Administration"
                title="Users & roles"
                description="Viewers read published knowledge. Editors write knowledge, manage clients and create intakes and BRDs. Administrators also manage settings, agent keys and people. Changes are recorded in the audit log."
                actions={
                    <Button variant="solid" size="sm" icon={<AddUserIcon />} onClick={() => setInviting(true)}>
                        Invite someone
                    </Button>
                }
            />
            <Card bodyClass="p-0">
                <div className="flex flex-col gap-3 border-b border-gray-200 p-4 md:flex-row md:items-center md:justify-between dark:border-gray-700">
                    <UserSearch />
                    <Segment
                        size="sm"
                        value={query.role ?? 'all'}
                        onChange={(value) => {
                            if (typeof value !== 'string' || !value) return // clicking the active filter keeps it
                            setQuery({ role: value === 'all' ? null : (value as Role) })
                        }}
                        aria-label="Filter by role"
                    >
                        {ROLE_FILTERS.map((filter) => (
                            <Segment.Item key={filter.value} value={filter.value} type="button">
                                {filter.label}
                            </Segment.Item>
                        ))}
                    </Segment>
                </div>

                {error && !data ? (
                    <ErrorState message={error} onRetry={() => void refresh()} />
                ) : (
                    <Loading loading={loading && !data} message="Loading users…">
                        {records.length === 0 ? (
                            <EmptyState
                                icon={<PeopleIcon />}
                                title={filtered ? 'No one matches' : 'No users yet'}
                                description={
                                    filtered
                                        ? 'Try a different name or email, or clear the role filter.'
                                        : 'People appear here once they sign up or accept an invitation.'
                                }
                                action={
                                    filtered ? (
                                        <Button size="sm" onClick={() => setQuery({ q: '', role: null })}>
                                            Clear filters
                                        </Button>
                                    ) : undefined
                                }
                            />
                        ) : (
                            <div className="overflow-x-auto">
                                <Table hoverable className={validating ? 'opacity-70 transition-opacity' : undefined}>
                                    <THead>
                                        <Tr>
                                            <Th>Name</Th>
                                            <Th>Role</Th>
                                            <Th>Joined</Th>
                                            <Th>
                                                <span className="sr-only">Actions</span>
                                            </Th>
                                        </Tr>
                                    </THead>
                                    <TBody>
                                        {records.map((account) => {
                                            const isMe = account.id === me?.id
                                            const roleSelect = (
                                                <div className="w-40">
                                                    <Select
                                                        size="sm"
                                                        aria-label={`Role for ${account.displayName}`}
                                                        options={ROLE_OPTIONS}
                                                        value={ROLE_OPTIONS.find((o) => o.value === account.role)}
                                                        isSearchable={false}
                                                        isDisabled={isMe}
                                                        menuPortalTarget={
                                                            typeof document === 'undefined' ? undefined : document.body
                                                        }
                                                        menuPosition="fixed"
                                                        styles={{ menuPortal: (base) => ({ ...base, zIndex: 60 }) }}
                                                        onChange={(option) => {
                                                            if (option && option.value !== account.role) {
                                                                setRoleChange({ user: account, role: option.value })
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            )
                                            return (
                                                <Tr key={account.id}>
                                                    <Td>
                                                        <div className="flex items-center gap-3">
                                                            <UserAvatar
                                                                userId={account.id}
                                                                name={account.displayName}
                                                                size={34}
                                                            />
                                                            <div className="min-w-0">
                                                                <div className="font-semibold text-gray-900 dark:text-gray-100">
                                                                    {account.displayName}
                                                                    {isMe && (
                                                                        <span className="ml-1.5 text-xs font-normal text-gray-500">
                                                                            (you)
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="truncate text-xs text-gray-500">
                                                                    {account.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Td>
                                                    <Td>
                                                        {isMe ? (
                                                            <Tooltip title="You can’t change your own role — ask another administrator.">
                                                                {roleSelect}
                                                            </Tooltip>
                                                        ) : (
                                                            roleSelect
                                                        )}
                                                    </Td>
                                                    <Td className="whitespace-nowrap">
                                                        {formatDate(account.createdAt)}
                                                    </Td>
                                                    <Td className="text-right whitespace-nowrap">
                                                        <Tooltip title="Email a sign-in link">
                                                            <Button
                                                                size="xs"
                                                                variant="plain"
                                                                icon={<EmailIcon />}
                                                                loading={sendingLinkTo === account.id}
                                                                aria-label={`Email ${account.displayName} a sign-in link`}
                                                                onClick={() => void sendSignInLink(account)}
                                                            />
                                                        </Tooltip>
                                                        {!isMe && (
                                                            <Tooltip title="Delete account">
                                                                <Button
                                                                    size="xs"
                                                                    variant="plain"
                                                                    icon={<DeleteIcon />}
                                                                    aria-label={`Delete ${account.displayName}’s account`}
                                                                    onClick={() => setDeleting(account)}
                                                                />
                                                            </Tooltip>
                                                        )}
                                                    </Td>
                                                </Tr>
                                            )
                                        })}
                                    </TBody>
                                </Table>
                            </div>
                        )}
                    </Loading>
                )}

                {data && data.total > USERS_PAGE_SIZE && (
                    <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 p-4 sm:flex-row dark:border-gray-700">
                        <span className="text-sm text-gray-500">{data.total.toLocaleString()} people</span>
                        <Pagination
                            total={data.total}
                            pageSize={USERS_PAGE_SIZE}
                            currentPage={query.page}
                            onChange={(page) => setQuery({ page })}
                        />
                    </div>
                )}
            </Card>

            <ChangeRoleDialog
                user={roleChange?.user ?? null}
                role={roleChange?.role ?? null}
                onClose={() => setRoleChange(null)}
            />
            {inviting && <InviteUserDialog onClose={() => setInviting(false)} />}
            <DeleteAccountDialog
                user={deleting}
                onClose={() => setDeleting(null)}
                onDeleted={() => {
                    setDeleting(null)
                    void refresh()
                }}
            />
        </>
    )
}
