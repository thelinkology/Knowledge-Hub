import Select, { type SelectProps } from './Select'
import { type BadgeOption } from '@/@types/common'
import Components from './custom/badge/MultiSelectComponents'

export type BadgeMultiSelectProps = Omit<SelectProps<BadgeOption, true>, 'components' | 'isMulti'>
export default function BadgeMultiSelect(props: BadgeMultiSelectProps) {
    return <Select<BadgeOption, true> {...props} components={Components} isMulti />
}
