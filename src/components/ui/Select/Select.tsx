'use client'

/* eslint-disable @typescript-eslint/no-unused-vars */
import cn from '../utils/classNames'
import ReactSelect from 'react-select'
import CreatableSelect from 'react-select/creatable'
import AsyncSelect from 'react-select/async'
import { useConfig } from '../ConfigProvider'
import { useForm, useFormItem } from '../Form/context'
import { useInputGroup } from '../InputGroup/context'
import { HiChevronDown, HiX } from 'react-icons/hi'
import DefaultOption from './Option'
import Spinner from '../Spinner/Spinner'
import { CONTROL_SIZES } from '../utils/constants'
import type { CommonProps, TypeAttributes } from '../@types/common'
import type { Props as ReactSelectProps, StylesConfig, ClassNamesConfig, GroupBase } from 'react-select'
import type { AsyncProps } from 'react-select/async'
import type { CreatableProps } from 'react-select/creatable'
import { useId } from 'react'
import type { Ref, JSX } from 'react'

const DefaultDropdownIndicator = () => {
    return (
        <div className="select-dropdown-indicator">
            <HiChevronDown />
        </div>
    )
}

interface DefaultClearIndicatorProps {
    innerProps: JSX.IntrinsicElements['div']
    ref: Ref<HTMLElement>
}

const DefaultClearIndicator = ({ innerProps: { ref, ...restInnerProps } }: DefaultClearIndicatorProps) => {
    return (
        <div {...restInnerProps} ref={ref}>
            <div className="select-clear-indicator">
                <HiX />
            </div>
        </div>
    )
}

interface DefaultLoadingIndicatorProps {
    selectProps: { themeColor?: string }
}

const DefaultLoadingIndicator = ({ selectProps }: DefaultLoadingIndicatorProps) => {
    const { themeColor } = selectProps
    return <Spinner className={`select-loading-indicatior text-${themeColor}`} />
}

export type SelectProps<
    Option,
    IsMulti extends boolean = false,
    Group extends GroupBase<Option> = GroupBase<Option>,
> = CommonProps &
    ReactSelectProps<Option, IsMulti, Group> &
    AsyncProps<Option, IsMulti, Group> &
    CreatableProps<Option, IsMulti, Group> & {
        hidden?: boolean
        disabled?: boolean
        invalid?: boolean
        size?: TypeAttributes.ControlSize
        field?: any // eslint-disable-line @typescript-eslint/no-explicit-any
        componentAs?: ReactSelect | CreatableSelect | AsyncSelect
    }

function Select<Option, IsMulti extends boolean = false, Group extends GroupBase<Option> = GroupBase<Option>>(
    props: SelectProps<Option, IsMulti, Group>,
) {
    const {
        components,
        componentAs: Component = ReactSelect,
        styles,
        className,
        classNames,
        isDisabled,
        hidden,
        disabled,
        invalid,
        size,
        field,
        ...rest
    } = props

    // react-select generates element ids; a stable instanceId keeps server and client HTML identical
    const generatedId = useId()
    const instanceId = rest.instanceId ?? generatedId

    const { controlSize } = useConfig()
    const formControlSize = useForm()?.size
    const formItemInvalid = useFormItem()?.invalid
    const inputGroupSize = useInputGroup()?.size

    const selectSize = (size || inputGroupSize || formControlSize || controlSize) as keyof typeof CONTROL_SIZES

    const isSelectInvalid = invalid || formItemInvalid

    const selectClass = cn(`select select-${selectSize}`, className)

    return (
        <Component<Option, IsMulti, Group>
            instanceId={instanceId}
            className={selectClass}
            classNames={
                {
                    control: (state) =>
                        cn(
                            'select-control',
                            CONTROL_SIZES[selectSize].minH,
                            state.isDisabled && 'opacity-50 cursor-not-allowed',
                            hidden && 'hidden',
                            (() => {
                                const { isFocused } = state

                                const classes: string[] = [
                                    isFocused
                                        ? 'select-control-focused ring-1 ring-primary border-primary bg-white dark:bg-gray-800'
                                        : 'bg-gray-100 dark:bg-gray-700',
                                ]

                                if (isSelectInvalid) {
                                    classes.push('select-control-invalid bg-error-subtle')
                                }

                                if (isFocused && isSelectInvalid) {
                                    classes.push('ring-error border-error')
                                }

                                return classes
                            })(),
                        ),
                    valueContainer: ({ isMulti, hasValue, selectProps }) =>
                        cn(
                            'select-value-container',
                            isMulti && hasValue && selectProps.controlShouldRenderValue ? 'flex' : 'grid',
                        ),
                    input: ({ value, isDisabled }) =>
                        cn(
                            'select-input-container',
                            isDisabled ? 'invisible' : 'visible',
                            value && '[transform:translateZ(0)]',
                        ),
                    placeholder: () => cn('select-placeholder', isSelectInvalid ? 'text-error' : 'text-gray-400'),
                    indicatorsContainer: () => 'select-indicators-container',
                    singleValue: () => 'select-single-value',
                    multiValue: () => 'select-multi-value',
                    multiValueLabel: () => 'select-multi-value-label',
                    multiValueRemove: () => 'select-multi-value-remove',
                    menu: () => 'select-menu',
                    ...classNames,
                } as ClassNamesConfig<Option, IsMulti, Group>
            }
            classNamePrefix={'select'}
            styles={
                {
                    control: () => ({}),
                    valueContainer: () => ({}),
                    input: ({ margin, paddingTop, paddingBottom, ...provided }) => ({ ...provided }),
                    placeholder: () => ({}),
                    singleValue: () => ({}),
                    multiValue: () => ({}),
                    multiValueLabel: () => ({}),
                    multiValueRemove: () => ({}),
                    menu: ({
                        backgroundColor,
                        marginTop,
                        marginBottom,
                        border,
                        borderRadius,
                        boxShadow,
                        ...provided
                    }) => ({ ...provided, zIndex: 50 }),
                    ...styles,
                } as StylesConfig<Option, IsMulti, Group>
            }
            components={{
                IndicatorSeparator: () => null,
                Option: DefaultOption,
                LoadingIndicator: DefaultLoadingIndicator,
                DropdownIndicator: DefaultDropdownIndicator,
                ClearIndicator: DefaultClearIndicator,
                ...components,
            }}
            isDisabled={isDisabled || disabled}
            {...field}
            {...rest}
        />
    )
}

export default Select
