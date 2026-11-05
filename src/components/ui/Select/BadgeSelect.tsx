import Select, { type SelectProps } from './Select'
import { type BadgeOption } from '@/@types/common'
import Components from './custom/badge/SelectComponents'

export type BadgeSelectProps = Omit<SelectProps<BadgeOption, false>, 'components'>
export default function BadgeSelect(props: BadgeSelectProps) {
    return <Select<BadgeOption, false> {...props} components={Components} />
}
