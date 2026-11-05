/**
 * Typed errors thrown by server actions. `apiHandler` turns them into `{ error, code, ...extra }` with the
 * matching HTTP status; the UI branches on `code` via `getErrorCode(error)`.
 */
export class AppError extends Error {
    readonly status: number
    readonly code: string
    readonly extra?: Record<string, unknown>

    constructor(message: string, status: number, code: string, extra?: Record<string, unknown>) {
        super(message)
        this.name = new.target.name
        this.status = status
        this.code = code
        this.extra = extra
    }
}

/** 400 — the request can't be processed as sent */
export class DataError extends AppError {
    constructor(message: string, code = 'INVALID_DATA', extra?: Record<string, unknown>) {
        super(message, 400, code, extra)
    }
}

/** 401 — not signed in */
export class UnauthorizedError extends AppError {
    constructor(message = 'Please sign in to continue.', code = 'UNAUTHORIZED') {
        super(message, 401, code)
    }
}

/** 403 — signed in, but this role/user may not do this */
export class ForbiddenError extends AppError {
    constructor(message = 'You don’t have permission to do that.', code = 'FORBIDDEN') {
        super(message, 403, code)
    }
}

/** 404 */
export class NotFoundError extends AppError {
    constructor(message = 'We couldn’t find that.', code = 'NOT_FOUND') {
        super(message, 404, code)
    }
}

/** 409 — conflicts with the current state (already submitted, attempt limit, duplicate…) */
export class ConflictError extends AppError {
    constructor(message: string, code = 'CONFLICT', extra?: Record<string, unknown>) {
        super(message, 409, code, extra)
    }
}

/** 413 */
export class DataTooLargeError extends AppError {
    constructor(message = 'That is too large to upload.', code = 'TOO_LARGE') {
        super(message, 413, code)
    }
}

/** 429 */
export class TooManyRequestsError extends AppError {
    constructor(
        message = 'Too many attempts — please wait a moment and try again.',
        code = 'RATE_LIMITED',
        extra?: { retryAfter?: number },
    ) {
        super(message, 429, code, extra)
    }
}

/** 503 — a dependency (database, AI provider) isn't configured or reachable */
export class ServiceUnavailableError extends AppError {
    constructor(message: string, code = 'SERVICE_UNAVAILABLE') {
        super(message, 503, code)
    }
}

/** JSON body of every API error response */
export interface ApiErrorBody {
    error: string
    code: string
    [key: string]: unknown
}
