'use client'

import classNames from '../utils/classNames'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm, FormItemContextProvider } from './context'
import { useConfig } from '../ConfigProvider'
import { CONTROL_SIZES, LAYOUT } from '../utils/constants'
import type { CommonProps, TypeAttributes } from '../@types/common'
import type { ReactNode, Ref } from 'react'

export interface FormItemProps extends CommonProps {
    asterisk?: boolean
    errorMessage?: string
    extra?: string | ReactNode
    htmlFor?: string
    invalid?: boolean
    label?: string
    labelClass?: string
    labelWidth?: string | number
    layout?: TypeAttributes.FormLayout
    valueClass?: string
    ref?: Ref<HTMLDivElement>
    size?: TypeAttributes.ControlSize
    hidden?: boolean
    relative?: boolean
}

const FormItem = (props: FormItemProps) => {
    const {
        asterisk,
        children,
        className,
        errorMessage,
        extra,
        htmlFor,
        invalid,
        label,
        labelClass,
        labelWidth,
        layout,
        valueClass,
        ref,
        style,
        size,
        hidden = false,
        relative = true,
    } = props

    const formContext = useForm()
    const { controlSize } = useConfig()

    const formItemLabelHeight = size || formContext?.size || controlSize
    const formItemLabelWidth = labelWidth || formContext?.labelWidth
    const formItemLayout = layout || formContext?.layout || 'vertical'

    const getFormLabelLayoutClass = () => {
        switch (formItemLayout) {
            case LAYOUT.HORIZONTAL:
                return label
                    ? `${CONTROL_SIZES[formItemLabelHeight].h} ${label && 'ltr:pr-2 rtl:pl-2'}`
                    : 'ltr:pr-2 rtl:pl-2'
            case LAYOUT.VERTICAL:
                return `mb-2`
            case LAYOUT.INLINE:
                return `${CONTROL_SIZES[formItemLabelHeight].h} ${label && 'ltr:pr-2 rtl:pl-2'}`
            default:
                return ''
        }
    }

    const formItemClass = classNames(
        'form-item',
        formItemLayout,
        className,
        invalid && 'invalid',
        hidden && 'hidden',
        !relative && 'm-0', // errors will be inline below the field - no need to offset (default behaviour)
    )

    const formLabelClass = classNames('form-label', label && getFormLabelLayoutClass(), labelClass)

    const formLabelStyle = () => {
        if (formItemLayout === LAYOUT.HORIZONTAL) {
            return { ...style, ...{ minWidth: formItemLabelWidth } }
        }
        return { ...style }
    }

    const enterStyle = { opacity: 1, marginTop: 3, bottom: relative ? -21 : undefined } // errors will be inline below the field - no need to offset (default behaviour)
    const exitStyle = { opacity: 0, marginTop: -10 }
    const initialStyle = exitStyle

    return (
        <FormItemContextProvider value={{ invalid }}>
            <div ref={ref} className={formItemClass}>
                {(label || asterisk || extra) && (
                    <label htmlFor={htmlFor} className={formLabelClass} style={formLabelStyle()}>
                        {asterisk && <span className="text-red-500 ltr:mr-1 rtl:ml-1">*</span>}
                        {label}
                        {extra && <span>{extra}</span>}
                        {label && formItemLayout !== 'vertical' && ':'}
                    </label>
                )}
                <div
                    className={classNames(
                        formItemLayout === LAYOUT.HORIZONTAL ? 'w-full flex flex-col justify-center' : '',
                        relative ? ' relative' : '', // errors will be inline below the field - no need to offset (default behaviour)
                        valueClass,
                    )}
                >
                    {children}
                    <AnimatePresence mode="wait">
                        {invalid && (
                            <motion.div
                                className="form-explain"
                                style={{ position: relative ? undefined : 'unset' }} // errors will be inline below the field - no need to offset (default behaviour)
                                initial={initialStyle}
                                animate={enterStyle}
                                exit={exitStyle}
                                transition={{ duration: 0.15, type: 'tween' }}
                            >
                                {errorMessage}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </FormItemContextProvider>
    )
}
export default FormItem
