import type { ForwardRefExoticComponent, RefAttributes } from 'react'
import _TimeSelect, { TimeSelectProps } from './TimeSelect'

export type { TimeSelectProps } from './TimeSelect'

type CompoundedComponent = ForwardRefExoticComponent<TimeSelectProps & RefAttributes<HTMLSpanElement>>

const TimeSelect = _TimeSelect as CompoundedComponent

export { TimeSelect }

export default TimeSelect
