import { type BadgeOption } from '@/@types/common'
import { type SelectComponentsConfig, type GroupBase } from 'react-select'
import Option from './controls/Option'
import MultiValueLabel from './controls/MultiValueLabel'

const MultiSelectComponents: SelectComponentsConfig<BadgeOption, true, GroupBase<BadgeOption>> = {
    Option,
    MultiValueLabel,
}
export default MultiSelectComponents
