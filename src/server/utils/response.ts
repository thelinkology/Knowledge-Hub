import 'server-only'
import { reportError } from '@/server/observability/reportError'
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { AppError, type ApiErrorBody } from '@/@types/errors'

const NO_STORE = { 'Cache-Control': 'no-store' }

export const getJsonResponse = <T>(data: T, init?: { status?: number }) =>
    NextResponse.json(data, { status: init?.status ?? 200, headers: NO_STORE })

export const getEmptyResponse = () => new NextResponse(null, { status: 204, headers: NO_STORE })

/** Every thrown error becomes `{ error, code, ...extra }` with the right status; unknown errors are logged, not leaked. */
export function getApiErrorResponse(error: unknown, path?: string) {
    if (error instanceof AppError) {
        const body: ApiErrorBody = { error: error.message, code: error.code, ...error.extra }
        const retryAfter = error.status === 429 ? Number(error.extra?.retryAfter) : NaN
        return NextResponse.json(body, {
            status: error.status,
            headers: Number.isFinite(retryAfter) ? { ...NO_STORE, 'Retry-After': String(retryAfter) } : NO_STORE,
        })
    }
    if (error instanceof ZodError) {
        const issue = error.issues[0]
        const field = issue?.path.join('.')
        const body: ApiErrorBody = {
            error: issue ? `${field ? `${field}: ` : ''}${issue.message}` : 'The request was not valid.',
            code: 'INVALID_DATA',
            issues: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
        }
        return NextResponse.json(body, { status: 400, headers: NO_STORE })
    }
    const reference = reportError(error, { source: 'server', path })
    const body: ApiErrorBody = {
        error: `Something went wrong on our side. Please try again (reference ${reference}).`,
        code: 'INTERNAL_ERROR',
        reference,
    }
    return NextResponse.json(body, { status: 500, headers: NO_STORE })
}
