import { useContext, useCallback, useState, useEffect, useMemo } from 'react'
import classNames from 'classnames'
import CheckboxGroupContext from './context'
import type { CommonProps } from '../@types/common'
import type { CheckboxValue } from './context'
import type { ChangeEvent, Ref } from 'react'

const isChecked = (
    controlledChecked: boolean | undefined,
    defaultChecked: boolean | undefined,
    groupValue: CheckboxValue[] | undefined,
    value: CheckboxValue | undefined,
) => {
    if (typeof groupValue !== 'undefined' && typeof value !== 'undefined') {
        return groupValue.some((i) => i === value)
    }
    return controlledChecked || defaultChecked
}

export interface CheckboxProps extends CommonProps {
    checked?: boolean
    checkboxClass?: string
    defaultChecked?: boolean
    disabled?: boolean
    indeterminate?: boolean
    labelRef?: Ref<HTMLLabelElement>
    name?: string
    onChange?: (values: boolean, e: ChangeEvent<HTMLInputElement>) => void
    readOnly?: boolean
    ref?: Ref<HTMLInputElement>
    value?: CheckboxValue
}
const Checkbox = (props: CheckboxProps) => {
    const {
        name: nameContext,
        value: groupValue,
        onChange: onGroupChange,
        checkboxClass: checkboxClassContext,
    } = useContext(CheckboxGroupContext)

    const {
        checked: controlledChecked,
        className,
        checkboxClass,
        onChange,
        children,
        disabled,
        indeterminate = false,
        readOnly,
        name = nameContext,
        defaultChecked,
        value,
        labelRef,
        ref,
        ...rest
    } = props

    const [checkboxChecked, setCheckboxChecked] = useState(
        isChecked(controlledChecked, defaultChecked, groupValue, value),
    )
    useEffect(
        () => setCheckboxChecked(isChecked(controlledChecked, defaultChecked, groupValue, value)),
        [controlledChecked, defaultChecked, groupValue, value],
    )

    const controlProps = useMemo(() => {
        const ret: { checked?: boolean; defaultChecked?: boolean } = {}
        if (typeof groupValue !== 'undefined') {
            ret.checked = groupValue.includes(value as never)
        } else {
            if (typeof controlledChecked !== 'undefined') {
                ret.checked = controlledChecked
            }
            if (defaultChecked) {
                ret.defaultChecked = defaultChecked
            }
        }
        return ret
    }, [controlledChecked, defaultChecked, groupValue, value])

    const onCheckboxChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            if (disabled || readOnly) {
                return
            }
            //
            const nextChecked =
                !checkboxChecked || (typeof groupValue !== 'undefined' && !groupValue.includes(value as never))
            setCheckboxChecked(nextChecked)
            onChange?.(nextChecked, e)
            onGroupChange?.(value as CheckboxValue, nextChecked, e)
        },
        [checkboxChecked, disabled, readOnly, setCheckboxChecked, onChange, value, onGroupChange, groupValue],
    )

    const checkboxColor = checkboxClass || checkboxClassContext || `text-primary`

    const checkboxDefaultClass = `checkbox peer ${checkboxColor}`
    const checkboxColorClass = disabled && 'disabled'
    const labelDefaultClass = `checkbox-label`
    const labelDisabledClass = disabled && 'disabled'

    const labelClass = classNames(labelDefaultClass, labelDisabledClass, className)

    return (
        <label ref={labelRef} className={labelClass}>
            <span className="checkbox-wrapper relative">
                <input
                    ref={ref}
                    className={classNames(checkboxDefaultClass, checkboxColorClass)}
                    type="checkbox"
                    disabled={disabled}
                    readOnly={readOnly}
                    name={name}
                    onChange={onCheckboxChange}
                    {...controlProps}
                    {...rest}
                />
                <>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5 stroke-neutral fill-neutral opacity-0 transition-opacity peer-checked:opacity-100 pointer-events-none absolute top-2/4 left-2/4 -translate-y-2/4 -translate-x-2/4 mt-[1.25px]"
                        viewBox="0 0 20 20"
                    >
                        {indeterminate ? (
                            <path
                                fillRule="evenodd"
                                d="M5 10a1 1 0 0 1 1-1h8a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1z"
                                clipRule="evenodd"
                            />
                        ) : (
                            <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0z"
                                clipRule="evenodd"
                            />
                        )}
                    </svg>
                </>
            </span>
            {children ? <span className={classNames(disabled ? 'opacity-50' : '')}>{children}</span> : null}
        </label>
    )
}

export default Checkbox
