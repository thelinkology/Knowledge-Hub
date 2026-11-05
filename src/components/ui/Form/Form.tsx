'use client'

import { type Ref, type ComponentPropsWithoutRef, useEffect, useState } from 'react'
import FormContainer, { type FormContainerProps } from './FormContainer'
import Alert from '@/components/ui/Alert'
import { useFormContext, type FieldErrors } from 'react-hook-form'
import classNames from '@/utils/classNames'

const getUnboundErrorMessages = (errors: FieldErrors | undefined, parent?: FieldErrors, path?: string): string[] => {
    const flatErrors = getFlatErrors(errors, path)
    const unboundErrors = flatErrors
        .filter((error) => !!error.message) // must have a message
        .filter((error) => {
            if (error.root) {
                // if this is an object root-level error, check whether there are child errors bound to elements
                const parentPath = error.path.replace(/\.?root$/, '')
                const hasBoundChildErrors = flatErrors.some(
                    ({ path }) => path !== parentPath && (!parentPath || path.startsWith(parentPath)),
                )
                if (hasBoundChildErrors) {
                    return false // ignore the parent error if there are already bound child errors
                }
            }
        })
        .filter((error) => !error.bound) // only include errors that are not bound to an element (ie. not shown on the UI)
        .filter((error, index, self) => self.findIndex((_) => _.message === error.message) === index) // must be unique by message
    return unboundErrors.map((error) => error.message) // only return messages
}
interface FlatError {
    root: boolean
    path: string
    message: string
    bound: boolean
}
const getFlatErrors = (errors: FieldErrors | undefined, path?: string): FlatError[] => {
    if (!(errors && typeof errors === 'object')) {
        return []
    } // skip invalid errors object (not expected)
    const ret: FlatError[] = []
    Object.entries(errors).forEach(([key, error]) => {
        if (!(error && typeof error === 'object')) {
            return
        } // skip invalid error/parent entries (not expected)
        if ('ref' in error) {
            // actual error (not a parent object)
            const message = typeof error.message === 'string' ? error.message : undefined
            ret.push({
                root: !path || key === 'root',
                path: path ? `${path}.${key}` : key,
                message: message ?? '',
                bound: error.ref !== undefined,
            })
        } else {
            // parent object (not an actual error)
            const nested = getFlatErrors(error as FieldErrors, path ? `${path}.${key}` : key)
            ret.push(...nested)
        }
    })
    return ret
}

export interface FormAlert {
    title?: React.ReactNode | string
    message: React.ReactNode | string
    className?: string
}

export type FormProps = ComponentPropsWithoutRef<'form'> &
    Omit<FormContainerProps, 'ref'> & {
        containerClassName?: string
        ref?: Ref<HTMLFormElement>
        success?: FormAlert | string
    }
export const Form = (props: FormProps) => {
    const { children, containerClassName, labelWidth, layout, size, ref, success, ...rest } = props

    const {
        formState: { errors },
    } = useFormContext()
    const [unboundErrorMessages, setUnboundErrorMessages] = useState<string[]>([])
    useEffect(() => setUnboundErrorMessages(getUnboundErrorMessages(errors)), [errors])

    return (
        <form ref={ref} {...rest}>
            <FormContainer
                //ref={refContainer}
                className={containerClassName}
                labelWidth={labelWidth}
                layout={layout}
                size={size}
            >
                {success ? (
                    <Alert
                        {...(typeof success === 'string'
                            ? { focus: true, children: success }
                            : { focus: true, children: success.message, ...success })}
                        className={classNames('mb-4', typeof success === 'string' ? undefined : success?.className)}
                        type="success"
                        showIcon
                        duration={0}
                        closable={false}
                    />
                ) : (
                    <div>
                        {unboundErrorMessages.map((message, index) => (
                            <Alert
                                key={index}
                                focus={true}
                                className="mb-4"
                                type="danger"
                                showIcon
                                duration={0}
                                closable={true}
                                onClose={() =>
                                    setUnboundErrorMessages(unboundErrorMessages.filter((_) => _ !== message))
                                }
                            >
                                {message}
                            </Alert>
                        ))}
                    </div>
                )}
                {children}
            </FormContainer>
        </form>
    )
}
export default Form
