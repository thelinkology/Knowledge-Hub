import axios, { type AxiosRequestConfig, isAxiosError } from 'axios'
import axiosRetry from 'axios-retry'
import type { ApiErrorBody } from '@/@types/errors'

/** An API failure with the server's message, HTTP status and error code (e.g. MAX_ATTEMPTS). */
export class ApiError extends Error {
    readonly status: number
    readonly code: string
    readonly body: ApiErrorBody | null

    constructor(message: string, status: number, code: string, body: ApiErrorBody | null) {
        super(message)
        this.name = 'ApiError'
        this.status = status
        this.code = code
        this.body = body
    }
}

export interface ApiOptions {
    signal?: AbortSignal
    timeout?: number
}

interface RequestOptions extends ApiOptions {
    method: 'get' | 'post' | 'put' | 'patch' | 'delete'
    url: string
    data?: unknown
    params?: Record<string, string | number | boolean | null | undefined>
}

const client = axios.create({ baseURL: '/api', timeout: 30_000, headers: { 'Content-Type': 'application/json' } })

// Only retry requests that are safe to repeat; writes are retried by the user (and are idempotent server-side).
axiosRetry(client, {
    retries: 2,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) =>
        ['get', 'head', 'options'].includes(error.config?.method ?? '') &&
        (axiosRetry.isNetworkError(error) || [502, 503, 504].includes(error.response?.status ?? 0)),
})

const toApiError = (error: unknown): ApiError => {
    if (isAxiosError(error)) {
        if (!error.response) {
            return new ApiError(
                error.code === 'ECONNABORTED'
                    ? 'The request took too long. Check your connection and try again.'
                    : 'Can’t reach the Academy. Check your connection and try again.',
                0,
                'NETWORK_ERROR',
                null,
            )
        }
        const body = error.response.data as ApiErrorBody | undefined
        if (error.response.status === 401 && typeof window !== 'undefined') {
            // Session expired: a full page load to sign-in (clears client state), then back here afterwards
            const returnTo = encodeURIComponent(window.location.pathname + window.location.search)
            // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- deliberate full reload outside React
            window.location.assign(`/login?expired=1&returnTo=${returnTo}`)
        }
        return new ApiError(
            body?.error || `Request failed (${error.response.status})`,
            error.response.status,
            body?.code || 'ERROR',
            body ?? null,
        )
    }
    return new ApiError(error instanceof Error ? error.message : 'Something went wrong.', 0, 'ERROR', null)
}

async function fetchJson<T>({ method, url, data, params, signal, timeout }: RequestOptions): Promise<T> {
    const config: AxiosRequestConfig = { method, url, data, params, signal, timeout }
    try {
        const response = await client.request<T>(config)
        return response.data
    } catch (error) {
        throw toApiError(error)
    }
}

const api = { fetchJson }

export default api
