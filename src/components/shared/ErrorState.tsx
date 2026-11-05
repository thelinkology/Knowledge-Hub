import Button from '@/components/ui/Button'
import { RefreshIcon, WarningIcon } from '@/configs/icons.config'
import classNames from '@/utils/classNames'
import type { ReactNode } from 'react'

interface ErrorStateProps {
    title?: string
    message: string
    onRetry?: () => void
    action?: ReactNode
    className?: string
}

/** A failure that says what happened and offers a retry (and/or another way forward). */
export default function ErrorState({
    title = 'Something went wrong',
    message,
    onRetry,
    action,
    className,
}: ErrorStateProps) {
    return (
        <div
            className={classNames('flex flex-col items-center justify-center gap-3 py-12 text-center', className)}
            role="alert"
        >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-error-subtle text-3xl text-error">
                <WarningIcon />
            </span>
            <h4 className="text-base font-semibold">{title}</h4>
            <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">{message}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
                {onRetry && (
                    <Button size="sm" icon={<RefreshIcon />} onClick={onRetry}>
                        Try again
                    </Button>
                )}
                {action}
            </div>
        </div>
    )
}
