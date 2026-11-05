'use client'

import ToastWrapper from './ToastWrapper'
import { PLACEMENT } from '../utils/constants'
import type { ToastProps, ToastWrapperProps } from './ToastWrapper'
import Notification, { NotificationProps } from '@/components/ui/Notification'
import { NotificationPlacement } from '../@types/placement'
import { type ReactNode, useMemo, useState } from 'react'
import { tryGetErrorMessage } from '@/utils/errors'

export const toastDefaultProps: ToastProps = {
    placement: PLACEMENT.TOP_END as NotificationPlacement,
    offsetX: 30,
    offsetY: 30,
    transitionType: 'scale',
    block: false,
}

export interface Toast {
    push(message: ReactNode, options?: ToastProps): Promise<string>
    remove(key: string): void
    removeAll(): void
}

const defaultWrapperId = 'default'
const wrappers = new Map()

function castPlacement(placement: NotificationPlacement) {
    if (/\top\b/.test(placement)) {
        return 'top-full'
    }
    if (/\bottom\b/.test(placement)) {
        return 'bottom-full'
    }
}

async function createWrapper(wrapperId: string, props: ToastProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [wrapper] = (await ToastWrapper.getInstance(props as ToastWrapperProps)) as any
    wrappers.set(wrapperId || defaultWrapperId, wrapper)
    return wrapper
}

function getWrapper(wrapperId?: string) {
    if (wrappers.size === 0) {
        return null
    }
    return wrappers.get(wrapperId || defaultWrapperId)
}

const toast: Toast = (message: ReactNode, options: ToastProps = toastDefaultProps) => toast.push(message, options)

toast.push = (message, options: ToastProps = toastDefaultProps) => {
    const id = (!options.block ? options.placement : castPlacement(options.placement as NotificationPlacement)) || ''

    const wrapper = getWrapper(id)
    if (wrapper?.current) {
        const key: string = wrapper.current.push(message) || ''
        return Promise.resolve(key)
    }

    return createWrapper(id, options).then((wrapper) => {
        const key: string = wrapper.current?.push(message) || ''
        return key
    })
}
toast.remove = (key) => {
    wrappers.forEach((wrapper) => wrapper.current.remove(key))
}
toast.removeAll = () => {
    wrappers.forEach((wrapper) => wrapper.current.removeAll())
}

function ErrorDetails({ error }: { error: unknown }) {
    const errorMessage = useMemo(() => tryGetErrorMessage(error), [error])
    const [expand, setExpand] = useState(false)
    return (
        <div>
            <button
                type="button"
                className="underline text-sm cursor-pointer"
                onClick={() => setExpand((prev) => !prev)}
            >
                {expand ? 'Hide details' : 'Show details'}
            </button>
            {expand && (
                <div className="overflow-x-hidden overflow-y-auto mt-1 max-w-[250px] max-h-[200px]">{errorMessage}</div>
            )}
        </div>
    )
}

export const toastInfo = (message: ReactNode, options?: Partial<Omit<NotificationProps, 'type'>>) => {
    const { duration = 10000, closable = true, ...rest } = options || {}
    return toast.push(
        <Notification type="info" duration={duration} closable={closable} {...rest}>
            {message}
        </Notification>,
        {
            placement: 'top-end',
        },
    )
}
export const toastSuccess = (message: ReactNode, options?: Partial<Omit<NotificationProps, 'type'>>) => {
    const { duration = 10000, closable = true, ...rest } = options || {}
    return toast.push(
        <Notification type="success" duration={duration} closable={closable} {...rest}>
            {message}
        </Notification>,
        {
            placement: 'top-end',
        },
    )
}
export const toastWarning = (
    message: ReactNode,
    error?: unknown,
    options?: Partial<Omit<NotificationProps, 'type'>>,
) => {
    const { duration = 30000, closable = true, ...rest } = options || {}
    return toast.push(
        <Notification type="warning" duration={duration} closable={closable} {...rest}>
            {message}
            {error ? <ErrorDetails error={error} /> : null}
        </Notification>,
        {
            placement: 'top-end',
        },
    )
}
export const toastError = (message: ReactNode, error?: unknown, options?: Partial<Omit<NotificationProps, 'type'>>) => {
    const { duration = 0, closable = true, ...rest } = options || {}
    return toast.push(
        <Notification type="danger" duration={duration} closable={closable} {...rest}>
            {message}
            {error ? <ErrorDetails error={error} /> : null}
        </Notification>,
        {
            placement: 'top-end',
        },
    )
}
export const toastClear = (id: string) => {
    toast.remove(id)
}

export default toast
