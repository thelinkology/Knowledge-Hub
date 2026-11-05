import { type BadgeOption } from '@/@types/common'
import { components, type ControlProps } from 'react-select'
import classNames from '@/utils/classNames'
import Badge from '@/components/ui/Badge'

export default function Control({ children, ...props }: ControlProps<BadgeOption, false>) {
    const option = props.getValue()[0]
    return (
        <components.Control {...props}>
            {option && <Badge className={classNames('ml-4', option.badgeClass || 'bg-gray-400')} />}
            {children}
        </components.Control>
    )
}
