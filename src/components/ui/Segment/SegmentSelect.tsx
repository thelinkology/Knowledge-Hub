import { forwardRef, useMemo, type ReactNode } from 'react'
import { type Option } from '@/@types/common'
import Segment, { type SegmentProps } from './Segment'
import SegmentItem from './SegmentItem'
import { HiCheckCircle } from 'react-icons/hi'
import classNames from '@/components/ui/utils/classNames'

export interface SegmentOption extends Option {
    value: string
    label: string
    description?: string | ReactNode
    disabled?: boolean
}
export interface SegmentSelectProps extends Omit<SegmentProps, 'ref' | 'selectionType'> {
    disabled?: boolean
    itemClass?: string
    options: SegmentOption[]
}
function SegmentSelect(props: SegmentSelectProps, ref: React.ForwardedRef<HTMLInputElement>) {
    const { disabled, options, className, itemClass, ...rest } = props
    const { value, onChange } = rest
    const items = useMemo(
        () =>
            disabled
                ? options.filter((option) => option.value === value) // if disabled, only show the selected option
                : options, // else show all options
        [disabled, options, value],
    )
    return (
        <>
            <input type="hidden" ref={ref} value={value || ''} onChange={(e) => onChange?.(e.target.value)} />
            <Segment
                {...rest}
                className={classNames(
                    'gap-4 w-full flex-col md:w-auto md:flex-row flex-wrap bg-transparent dark:bg-transparent',
                    className,
                )}
                selectionType="single"
            >
                {items.map((option, index) => (
                    <SegmentItem key={index} value={option.value} disabled={disabled || option.disabled}>
                        {({ active, disabled, onSegmentItemClick, sizeClass }) => (
                            <div
                                className={classNames(
                                    sizeClass,
                                    'flex',
                                    'ring-1',
                                    'justify-between',
                                    'border',
                                    'rounded-xl ',
                                    'dark:bg-transparent',
                                    'border-gray-300',
                                    'dark:border-gray-600',
                                    'py-5 px-4',
                                    'select-none',
                                    'w-full md:w-80',
                                    'h-auto',
                                    active ? 'ring-primary border-primary ' : 'ring-transparent bg-gray-100',
                                    disabled
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:ring-primary hover:border-primary cursor-pointer',
                                    itemClass,
                                )}
                                role="button"
                                onClick={onSegmentItemClick}
                            >
                                <div className="flex flex-col w-full">
                                    {option.label ? (
                                        <>
                                            <div className="flex flex-row justify-between items-center">
                                                <h6>{option.label}</h6>
                                                {active && <HiCheckCircle className="text-primary text-lg min-w-4" />}
                                            </div>
                                            {option.description ? (
                                                typeof option.description === 'string' ? (
                                                    <p>{option.description}</p>
                                                ) : (
                                                    option.description
                                                )
                                            ) : null}
                                        </>
                                    ) : option.description ? (
                                        <>
                                            <div className="flex flex-row justify-between items-center">
                                                <div className="flex flex-col">
                                                    {typeof option.description === 'string' ? (
                                                        <p>{option.description}</p>
                                                    ) : (
                                                        option.description
                                                    )}
                                                </div>
                                                {active && <HiCheckCircle className="text-primary text-lg min-w-4" />}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex flex-row justify-between items-center">
                                                <h6>{option.value}</h6>
                                                {active && <HiCheckCircle className="text-primary text-lg min-w-4" />}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </SegmentItem>
                ))}
            </Segment>
        </>
    )
}
const forwardedInput = forwardRef(SegmentSelect)
forwardedInput.displayName = 'SegmentSelect'
export default forwardedInput
