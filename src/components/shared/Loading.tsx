import Spinner from '@/components/ui/Spinner'
import classNames from '@/utils/classNames'
import type { ReactNode } from 'react'

interface LoadingProps {
    loading: boolean
    message?: string
    className?: string
    children?: ReactNode
}

/** A spinner (with a message) while `loading`; the children afterwards. */
export default function Loading({ loading, message, className, children }: LoadingProps) {
    if (!loading) return <>{children}</>
    return (
        <div
            className={classNames('flex flex-col items-center justify-center gap-3 py-12 text-gray-500', className)}
            role="status"
            aria-live="polite"
        >
            <Spinner size={32} />
            {message && <span className="text-sm">{message}</span>}
        </div>
    )
}
