'use client'

import { useEffect } from 'react'
import type { SWRResponse } from 'swr'
import { tryGetErrorMessage } from '@/utils/errors'
import type { ResourceState } from '@/stores/createResourceStore'

type Setters<T> = Pick<ResourceState<T>, 'setData' | 'setLoading' | 'setError' | 'setRefresh'>

/**
 * The SWR → Zustand bridge used by every *SWRProvider: pushes an SWR hook's data, loading, error and
 * revalidate function into a store, so leaf components read the store and never call SWR directly.
 */
export default function useSyncResource<T>(swr: SWRResponse<T>, setters: Setters<T>) {
    const { data, error, isLoading, isValidating, mutate } = swr
    const { setData, setLoading, setError, setRefresh } = setters
    useEffect(() => setData(data), [data, setData])
    useEffect(() => setLoading(isLoading, isValidating), [isLoading, isValidating, setLoading])
    useEffect(() => setError(error ? tryGetErrorMessage(error) : null), [error, setError])
    useEffect(() => setRefresh(() => mutate()), [mutate, setRefresh])
}
