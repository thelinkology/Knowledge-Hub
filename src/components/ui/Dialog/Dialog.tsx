'use client'

import { useCallback, useMemo, type MouseEvent } from 'react'
import { useWindowWidth } from '../hooks/useWindowSize'
import Modal from 'react-modal'
import type ReactModal from 'react-modal'
import CloseButton from '../CloseButton'
import classNames from 'classnames'

export interface DialogProps extends ReactModal.Props {
    closable?: boolean
    contentClassName?: string
    height?: string | number
    onClose?: (e: MouseEvent<HTMLSpanElement>) => void
    width?: number
}

const Dialog = (props: DialogProps) => {
    const {
        bodyOpenClassName,
        children,
        className,
        closable = true,
        closeTimeoutMS = 150,
        contentClassName,
        height,
        isOpen,
        onClose,
        overlayClassName,
        portalClassName,
        style,
        width = 520,
        ...rest
    } = props

    const onCloseClick = useCallback(
        (e: MouseEvent<HTMLSpanElement>) => {
            onClose?.(e)
        },
        [onClose],
    )

    const currentWidth = useWindowWidth()
    const contentStyle = useMemo(() => {
        const contentStyle = {
            content: {
                inset: 'unset',
            },
            ...style,
        }
        if (width !== undefined) {
            contentStyle.content.width = width
            if (typeof currentWidth !== 'undefined' && currentWidth <= width) {
                contentStyle.content.width = 'auto'
            }
        }
        if (height !== undefined) {
            contentStyle.content.height = height
        }
        return contentStyle
    }, [style, width, height, currentWidth])

    return (
        <Modal
            className={{
                base: classNames('dialog', className as string),
                afterOpen: 'dialog-after-open',
                beforeClose: 'dialog-before-close',
            }}
            overlayClassName={{
                base: classNames('dialog-overlay', overlayClassName as string),
                afterOpen: 'dialog-overlay-after-open',
                beforeClose: 'dialog-overlay-before-close',
            }}
            portalClassName={classNames('dialog-portal', portalClassName)}
            bodyOpenClassName={classNames('dialog-open', bodyOpenClassName)}
            ariaHideApp={false}
            isOpen={isOpen}
            style={{ ...contentStyle }}
            closeTimeoutMS={closeTimeoutMS}
            {...rest}
        >
            <div className={classNames('dialog-content', contentClassName)}>
                {closable && <CloseButton absolute className="ltr:right-6 rtl:left-6 top-4.5" onClick={onCloseClick} />}
                {children}
            </div>
        </Modal>
    )
}

Dialog.displayName = 'Dialog'

export default Dialog
