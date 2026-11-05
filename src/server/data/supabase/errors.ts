import 'server-only'
import type { PostgrestError, PostgrestSingleResponse } from '@supabase/supabase-js'
import { AppError, ConflictError, DataError, NotFoundError, ServiceUnavailableError } from '@/@types/errors'

/** A database failure we don't have a friendlier error for (502: the dependency failed, not the request). */
export class DatabaseError extends AppError {
    constructor(message: string, extra?: Record<string, unknown>) {
        super(message, 502, 'DATABASE_ERROR', extra)
    }
}

/**
 * Messages raised by our SQL functions (`raise exception 'CODE'`) → typed errors with friendly
 * wording. Anything else becomes a DatabaseError (details logged, not sent to the browser).
 */
const KNOWN_ERRORS: Record<string, () => AppError> = {
    ARTICLE_NOT_FOUND: () => new NotFoundError('That article no longer exists.', 'ARTICLE_NOT_FOUND'),
    ARTICLE_CHANGED: () =>
        new ConflictError(
            'Someone else saved this article while you were editing. Copy your changes, reload the page, and apply them again.',
            'ARTICLE_CHANGED',
        ),
}

export function toAppError(error: PostgrestError | Error, context: string): AppError {
    const message = error.message ?? ''
    const known = Object.keys(KNOWN_ERRORS).find((code) => message.includes(code))
    if (known) return KNOWN_ERRORS[known]()

    const code = 'code' in error ? error.code : undefined
    if (code === '23505') return new ConflictError('That already exists.', 'DUPLICATE')
    if (code === '23503') return new DataError('That refers to something that doesn’t exist.', 'INVALID_REFERENCE')
    if (code === '23514' || code === '22023' || code === '22P02') {
        return new DataError('Some of the values aren’t allowed. Check the form and try again.', 'INVALID_DATA')
    }
    if (code === 'PGRST301' || /fetch failed|ECONNREFUSED|ENOTFOUND/i.test(message)) {
        return new ServiceUnavailableError('The database can’t be reached right now. Please try again shortly.')
    }
    console.error(`[db] ${context}:`, error)
    return new DatabaseError(`Couldn’t ${context}. Please try again.`)
}

/** Supabase responses (or a hand-made `{ data, error: null }` for skipped queries) */
type SupabaseResult<T> = PostgrestSingleResponse<T> | { data: T; error: null }

/**
 * Unwraps a Supabase response that must have data (lists, `.single()`, inserts with `.select()`):
 * throws a typed error, otherwise returns the data. `context` completes "Couldn’t …" in the message the
 * user sees (e.g. 'load the course').
 */
export function unwrap<T>(result: SupabaseResult<T>, context: string): T {
    if (result.error) throw toAppError(result.error, context)
    if (result.data === null) throw toAppError(new Error('No data returned'), context)
    return result.data
}

/** For `.maybeSingle()` and writes without `.select()`: null when there is no row. */
export function unwrapMaybe<T>(result: SupabaseResult<T>, context: string): T | null {
    if (result.error) throw toAppError(result.error, context)
    return result.data
}

/** For writes whose result isn't needed: throws a typed error on failure. */
export function check(result: { error: PostgrestError | null }, context: string): void {
    if (result.error) throw toAppError(result.error, context)
}
