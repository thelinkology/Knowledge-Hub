'use client'

import Dialog from '@/components/ui/Dialog'
import Button, { type ButtonProps } from '@/components/ui/Button'
import { InfoIcon, SuccessIcon, WarningIcon } from '@/configs/icons.config'
import classNames from '@/utils/classNames'
import type { ReactNode } from 'react'

type ConfirmType = 'info' | 'success' | 'warning' | 'danger'

interface ConfirmDialogProps {
    isOpen: boolean
    onClose: () => void
    type?: ConfirmType
    title: ReactNode
    children?: ReactNode
    confirmText?: string
    cancelText?: string
    /** Omit when `confirmForm` submits a form in the body instead */
    onConfirm?: () => void
    /** id of a <form> in the body that the confirm button submits */
    confirmForm?: string
    confirmButtonProps?: Partial<ButtonProps>
    loading?: boolean
    closable?: boolean
    width?: number
}

const ICONS: Record<ConfirmType, { icon: ReactNode; className: string }> = {
    info: { icon: <InfoIcon />, className: 'bg-info-subtle text-info' },
    success: { icon: <SuccessIcon />, className: 'bg-success-subtle text-success' },
    warning: { icon: <WarningIcon />, className: 'bg-warning-subtle text-warning' },
    danger: { icon: <WarningIcon />, className: 'bg-error-subtle text-error' },
}

/** Every confirm/cancel dialog in the app. Irreversible actions use `warning`/`danger` and say what can't be undone. */
export default function ConfirmDialog({
    isOpen,
    onClose,
    type = 'info',
    title,
    children,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    confirmForm,
    confirmButtonProps,
    loading,
    closable = true,
    width = 520,
}: ConfirmDialogProps) {
    const { icon, className } = ICONS[type]
    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            onRequestClose={loading ? undefined : onClose}
            closable={closable && !loading}
            width={width}
        >
            <div className="flex gap-4">
                <span
                    className={classNames(
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl',
                        className,
                    )}
                >
                    {icon}
                </span>
                <div className="min-w-0 flex-1">
                    <h4 className="mb-2 pr-6">{title}</h4>
                    {children && <div className="text-gray-600 dark:text-gray-300">{children}</div>}
                </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button onClick={onClose} disabled={loading}>
                    {cancelText}
                </Button>
                <Button
                    variant="solid"
                    loading={loading}
                    onClick={confirmForm ? undefined : onConfirm}
                    type={confirmForm ? 'submit' : 'button'}
                    form={confirmForm}
                    className={type === 'danger' ? 'bg-error hover:bg-error' : undefined}
                    {...confirmButtonProps}
                >
                    {confirmText}
                </Button>
            </div>
        </Dialog>
    )
}
