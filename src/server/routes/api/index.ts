import 'server-only'
import type { NextRequest } from 'next/server'
import { assertPermission, requireUser } from '@/server/actions/auth'
import { getApiErrorResponse } from '@/server/utils/response'
import { DataError, ForbiddenError, NotFoundError } from '@/@types/errors'
import type { Permission } from '@/@types/auth/Roles'
import type { SessionUser } from '@/@types/auth/SessionUser'

export interface ApiRouteContext<P extends Record<string, string> = Record<string, string>> {
    params: Promise<P>
}

type ApiRouteHandler<P extends Record<string, string>> = (
    req: NextRequest,
    ctx: ApiRouteContext<P>,
) => Promise<Response>

type ApiAuthRouteHandler<P extends Record<string, string>> = (
    req: NextRequest,
    ctx: ApiRouteContext<P>,
    user: SessionUser,
) => Promise<Response>

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/**
 * Writes must come from our own pages. Browsers always send Origin on these requests; a mismatch
 * means another site is trying to use the visitor's session (CSRF).
 */
function assertSameOrigin(req: NextRequest) {
    if (!UNSAFE_METHODS.has(req.method)) return
    const origin = req.headers.get('origin')
    if (origin && origin !== req.nextUrl.origin) throw new ForbiddenError('Cross-site request blocked.', 'BAD_ORIGIN')
}

/** Wraps a route: thrown errors become JSON error responses with the right status. */
export const apiHandler =
    <P extends Record<string, string> = Record<string, string>>(handler: ApiRouteHandler<P>) =>
    async (req: NextRequest, ctx: ApiRouteContext<P>) => {
        try {
            assertSameOrigin(req)
            return await handler(req, ctx)
        } catch (error) {
            return getApiErrorResponse(error, req.nextUrl.pathname)
        }
    }

/**
 * Like apiHandler, but requires a signed-in user (401) and, when given, a permission (403).
 * `null` = any signed-in user (the action then decides, e.g. "only your own attempt").
 */
export const apiAuthHandler = <P extends Record<string, string> = Record<string, string>>(
    permission: Permission | null,
    handler: ApiAuthRouteHandler<P>,
) =>
    apiHandler<P>(async (req, ctx) => {
        const user = await requireUser()
        if (permission) assertPermission(user, permission)
        return handler(req, ctx, user)
    })

/** Parses a JSON body; malformed JSON → 400 */
export async function readJsonBody(req: Request): Promise<unknown> {
    try {
        return await req.json()
    } catch {
        throw new DataError('The request body must be valid JSON.', 'INVALID_JSON')
    }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** A route id parameter; malformed ids are a 404 like any other unknown id. */
export function readId(value: string | undefined, what = 'item'): string {
    if (!value || !UUID.test(value)) throw new NotFoundError(`That ${what} doesn’t exist.`)
    return value
}

/** Query string as a plain object (for zod) */
export const readQuery = (req: NextRequest) => Object.fromEntries(req.nextUrl.searchParams.entries())
