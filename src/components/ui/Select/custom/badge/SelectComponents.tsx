import { type BadgeOption } from '@/@types/common'
import { type SelectComponentsConfig, type GroupBase } from 'react-select'
import Control from './controls/Control'
import Option from './controls/Option'

const SelectComponents: SelectComponentsConfig<BadgeOption, false, GroupBase<BadgeOption>> = {
    Control: Control,
    Option: Option,
}
export default SelectComponents
