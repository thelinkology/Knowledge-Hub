import { useState, useMemo, useEffect } from 'react'
import useUniqueId from '../hooks/useUniqueId'
import useDidUpdate from '../hooks/useDidUpdate'
import { useFormItem } from '../Form/context'
import type { CommonProps, TypeAttributes } from '../@types/common'

import Select from '../Select'
import type { SingleValue } from 'react-select'
import type { Option } from '@/@types/common'

interface TimeOption extends Option {
    hours: number
    minutes: number
    seconds: number
    from: Date // standardised to today's date for comparisons
    to: Date // standardised to today's date for comparisons
}
const now = new Date(),
    today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
const getTodayValue = (value: Date): Date =>
    new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        value.getHours(),
        value.getMinutes(),
        value.getSeconds(),
        0,
    )
const getSelectedTimeOption = (time: Date | null, timeOptions: TimeOption[]): TimeOption | undefined => {
    if (time) {
        const value = getTodayValue(time) // standardised to today's date for comparisons
        const option = timeOptions.find((option) => value >= option.from && value < option.to)
        return option
    }
    return undefined
}
const getTimeOption = (
    date: Date,
    mins: number,
    showSeconds: boolean,
    amPm: boolean,
    amLabel: string,
    pmLabel: string,
): TimeOption => {
    const hours = date.getHours(),
        hh = amPm
            ? String(hours === 0 ? 12 : hours > 12 ? hours - 12 : hours).padStart(2, '0')
            : String(hours).padStart(2, '0'),
        amPmLabel = amPm ? (hours < 12 ? amLabel : pmLabel) : ''
    const minutes = date.getMinutes(),
        mm = String(minutes).padStart(2, '0')
    const seconds = date.getSeconds(),
        ss = String(seconds).padStart(2, '0')
    const label = `${hh}:${mm}${showSeconds ? `:${ss}` : ''}${amPmLabel}`
    const value = label
    const from = new Date(date.getTime() - (mins / 2) * 60 * 1000) // used for comparisons to find the nearest selected time option
    const to = new Date(date.getTime() + (mins / 2) * 60 * 1000) // used for comparisons to find the nearest selected time option
    const timeOption: TimeOption = {
        label,
        value,
        hours,
        minutes,
        seconds,
        from,
        to,
    }
    return timeOption
}
const getTimeOptions = (
    mins: number,
    showSeconds: boolean,
    amPm: boolean,
    amLabel: string,
    pmLabel: string,
): TimeOption[] => {
    const ret: TimeOption[] = []
    const base = today.getTime(),
        tomorrowDate = today.getDate() + 1
    for (let i = 0, date = today; date.getDate() < tomorrowDate; i++, date = new Date(base + i * mins * 60 * 1000)) {
        const option = getTimeOption(date, mins, showSeconds, amPm, amLabel, pmLabel)
        ret.push(option)
    }
    return ret
}
const mergeDateWithTime = (date: Date | null, time: TimeOption | null): Date | null => {
    if (date || time) {
        const newDate = new Date(date || today)
        newDate.setHours(time?.hours || 0)
        newDate.setMinutes(time?.minutes || 0)
        newDate.setSeconds(time?.seconds || 0)
        newDate.setMilliseconds(0)
        return newDate
    }
    return null
}

type Value = Date | null

export interface TimeSelectProps extends CommonProps {
    id?: string
    name?: string
    invalid?: boolean
    disabled?: boolean
    clearable?: boolean
    onChange?: (value: Value) => void
    amPm?: boolean
    amLabel?: string
    pmLabel?: string
    size?: TypeAttributes.ControlSize
    className?: string
    placeholder?: string
    defaultValue?: Value
    value?: Value
    interval?: number // interval in minutes to generate time options
    showSeconds?: boolean
}

const TimeSelect = (props: TimeSelectProps) => {
    const {
        id,
        name,
        invalid,
        disabled = false,
        clearable = true,
        onChange,
        amPm = false,
        amLabel = 'AM',
        pmLabel = 'PM',
        size = 'md',
        className,
        placeholder = 'Time',
        defaultValue,
        value,
        interval = 15,
        showSeconds = false,
        ...rest
    } = props

    const uuid = useUniqueId(id)

    //const selectRef = useRef<HTMLSelectElement>(undefined)

    const actualInterval = useMemo(() => Math.min(Math.max(interval, 5), 12 * 60), [interval]) // interval must be between 5mins and 12hours (default is 15mins)
    const timeOptions = useMemo(
        () => getTimeOptions(actualInterval, showSeconds, amPm, amLabel, pmLabel),
        [actualInterval, showSeconds, amPm, amLabel, pmLabel],
    ) // get time options, based on the interval in minutes

    const [_value, setValue] = useState<Value>(value || defaultValue || null)
    const [timeOption, setTimeOption] = useState<TimeOption | null>(getSelectedTimeOption(_value, timeOptions) || null)
    useEffect(() => {
        // make sure the timeOption is selected, and the _value is always "rounded" as per the selected timeOption
        const timeOption = getSelectedTimeOption(_value, timeOptions) || null
        setTimeOption(timeOption)
        //
        const newValue = mergeDateWithTime(_value, timeOption)
        if (newValue?.getTime() !== _value?.getTime()) {
            setValue(newValue)
            onChange?.(newValue)
        }
    }, [_value, timeOptions, onChange])
    useDidUpdate(() => {
        // value was changed externally
        if (value?.getTime() !== _value?.getTime()) {
            setValue(value || null)
        }
    }, [value])

    const formItemInvalid = useFormItem()?.invalid
    const isTimeSelectInvalid = invalid || formItemInvalid

    const handleTimeSelected = (timeOption: SingleValue<TimeOption> | null) => {
        setTimeOption(timeOption || null)
        const newValue = mergeDateWithTime(_value, timeOption || null)
        setValue(newValue)
        onChange?.(newValue)
    }

    return (
        <Select<TimeOption>
            //ref={selectRef}
            id={uuid}
            name={name}
            options={timeOptions}
            value={timeOption}
            onChange={handleTimeSelected}
            isClearable={clearable}
            invalid={isTimeSelectInvalid}
            disabled={disabled}
            className={className}
            size={size}
            placeholder={placeholder}
            menuShouldScrollIntoView={true}
            {...rest}
        />
    )
}

export default TimeSelect
