import type { SWRConfiguration } from 'swr'
import { ApiError } from '@/services/api'

export const SWR_DEFAULTS: SWRConfiguration = {
    revalidateOnFocus: true,
    dedupingInterval: 2000,
    errorRetryCount: 2,
    // Don't retry what retrying can't fix
    shouldRetryOnError: (error) => !(error instanceof ApiError && [400, 401, 403, 404, 409].includes(error.status)),
}

/** Reference data that rarely changes in a session (subjects, ranks) */
export const SWR_ONCE_ONLY: SWRConfiguration = {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
}

/** Polling for the notification bell */
export const NOTIFICATIONS_REFRESH_MS = 60_000
