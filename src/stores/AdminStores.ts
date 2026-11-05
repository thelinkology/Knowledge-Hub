import { create } from 'zustand'
import { createResourceStore, resourceSlice, type ResourceState } from './createResourceStore'
import type { Collection } from '@/@types/common'
import type { Role } from '@/@types/auth/Roles'
import type { UserAccount } from '@/@types/users/UserAccount'
import type { AuditEvent } from '@/@types/audit/AuditEvent'

/* Administration stores (filled by the admin *SWRProviders through useSyncResource). */

export interface UsersQueryState {
    q: string
    role: Role | null
    page: number
}

interface UsersState extends ResourceState<Collection<UserAccount>> {
    query: UsersQueryState
    /** Changing the search or role filter goes back to page 1 */
    setQuery: (query: Partial<UsersQueryState>) => void
}

export const useUsersStore = create<UsersState>()((set) => ({
    ...resourceSlice<Collection<UserAccount>, UsersState>(set),
    query: { q: '', role: null, page: 1 },
    setQuery: (query) =>
        set((state) => ({
            query: {
                ...state.query,
                ...query,
                page: query.page ?? (query.q !== undefined || query.role !== undefined ? 1 : state.query.page),
            },
        })),
}))

export interface AuditQueryState {
    page: number
    entityType: string | null
}

interface AuditState extends ResourceState<Collection<AuditEvent>> {
    query: AuditQueryState
    setQuery: (query: Partial<AuditQueryState>) => void
}

export const useAuditStore = create<AuditState>()((set) => ({
    ...resourceSlice<Collection<AuditEvent>, AuditState>(set),
    query: { page: 1, entityType: null },
    setQuery: (query) =>
        set((state) => ({
            query: {
                ...state.query,
                ...query,
                page: query.page ?? (query.entityType !== undefined ? 1 : state.query.page),
            },
        })),
}))

/** The latest audit events on the admin dashboard */
export const useRecentAuditStore = createResourceStore<Collection<AuditEvent>>()
