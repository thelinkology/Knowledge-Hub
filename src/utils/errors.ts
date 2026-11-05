import { ApiError } from '@/services/api'

/** A readable message for any thrown value (API errors carry the server's message). */
export function tryGetErrorMessage(error: unknown): string {
    if (!error) return 'Something went wrong.'
    if (typeof error === 'string') return error
    if (error instanceof ApiError) return error.message
    if (error instanceof Error) return error.message || 'Something went wrong.'
    return 'Something went wrong.'
}

/** The server's error `code` (e.g. MAX_ATTEMPTS, ALREADY_ENROLLED) when it sent one */
export const getErrorCode = (error: unknown): string | undefined => (error instanceof ApiError ? error.code : undefined)

export const isNotFoundError = (error: unknown) => error instanceof ApiError && error.status === 404
export const isConflictError = (error: unknown) => error instanceof ApiError && error.status === 409
