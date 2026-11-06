import { isUuid } from './ids'

/*
 * Who reads which client's knowledge. A scope is the list of clients someone (a viewer) or something (an
 * agent API key) may read, besides shared knowledge (client_id null); null means every client.
 */

export type ClientScope = readonly string[] | null

/** Whether an item of `clientId` (null = shared) is readable within `scope` */
export const inClientScope = (scope: ClientScope, clientId: string | null) =>
    scope === null || clientId === null || scope.includes(clientId)

/**
 * The PostgREST `or` filter for a scope: shared knowledge or one of the clients (only shared when the
 * list is empty). Ids that aren't UUIDs are dropped, so nothing else can reach the filter syntax.
 */
export const clientScopeFilter = (scope: readonly string[], column = 'client_id') => {
    const ids = scope.filter(isUuid)
    return ids.length ? `${column}.is.null,${column}.in.(${ids.join(',')})` : `${column}.is.null`
}

/**
 * The clients to search within when someone with `scope` asks for `wanted` (a client filter, or every
 * client they can read). null = no limit; undefined = the client asked for is outside the scope.
 */
export const searchClientIds = (scope: ClientScope, wanted?: string | null): string[] | null | undefined => {
    if (wanted) return inClientScope(scope, wanted) ? [wanted] : undefined
    return scope === null ? null : [...scope]
}
