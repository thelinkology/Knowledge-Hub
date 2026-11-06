import useSWR, { type SWRConfiguration } from 'swr'
import api from '@/services/api'
import { tryParseDate } from '@/utils/parse'
import type { Collection } from '@/@types/common'
import type {
    InviteUserInput,
    MyProfile,
    SetRoleInput,
    UpdateProfileInput,
    UserAccount,
    UsersQuery,
} from '@/@types/users/UserAccount'
import type { AuditEvent, AuditQuery } from '@/@types/audit/AuditEvent'

// ── The signed-in user's profile ──

export const profileUrl = '/me/profile'
export const apiGetProfile = () => api.fetchJson<MyProfile>({ method: 'get', url: profileUrl })
export const useSWRProfile = (config?: SWRConfiguration<MyProfile>) => useSWR(profileUrl, apiGetProfile, config)
export const apiUpdateProfile = (input: UpdateProfileInput) =>
    api.fetchJson<MyProfile>({ method: 'patch', url: profileUrl, data: input })

// ── Administration ──

export const getUsersUrl = ({ q, role, page }: Partial<UsersQuery>) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (role) params.set('role', role)
    params.set('page', String(page ?? 1))
    return `/admin/users?${params}`
}

export const apiGetUsers = async (query: Partial<UsersQuery>) => {
    const result = await api.fetchJson<Collection<UserAccount>>({ method: 'get', url: getUsersUrl(query) })
    return { ...result, records: result.records.map((u) => ({ ...u, createdAt: tryParseDate(u.createdAt) as Date })) }
}

export const useSWRUsers = (query: Partial<UsersQuery>, config?: SWRConfiguration<Collection<UserAccount>>) =>
    useSWR(getUsersUrl(query), () => apiGetUsers(query), { keepPreviousData: true, ...config })

export const apiSetUserRole = (userId: string, input: SetRoleInput) =>
    api.fetchJson<void>({ method: 'patch', url: `/admin/users/${userId}`, data: input })

export const apiInviteUser = (input: InviteUserInput) =>
    api.fetchJson<UserAccount>({ method: 'post', url: '/admin/users', data: input })

export const apiSendUserSignInLink = (userId: string) =>
    api.fetchJson<{ email: string }>({ method: 'post', url: `/admin/users/${userId}/sign-in-link` })

export const apiDeleteUser = (userId: string) =>
    api.fetchJson<void>({ method: 'delete', url: `/admin/users/${userId}` })

export const getAuditUrl = ({ page, entityType }: Partial<AuditQuery>) =>
    `/admin/audit?page=${page ?? 1}${entityType ? `&entityType=${encodeURIComponent(entityType)}` : ''}`

export const apiGetAuditEvents = async (query: Partial<AuditQuery>) => {
    const result = await api.fetchJson<Collection<AuditEvent>>({ method: 'get', url: getAuditUrl(query) })
    return { ...result, records: result.records.map((e) => ({ ...e, createdAt: tryParseDate(e.createdAt) as Date })) }
}

export const useSWRAuditEvents = (query: Partial<AuditQuery>, config?: SWRConfiguration<Collection<AuditEvent>>) =>
    useSWR(getAuditUrl(query), () => apiGetAuditEvents(query), { keepPreviousData: true, ...config })
