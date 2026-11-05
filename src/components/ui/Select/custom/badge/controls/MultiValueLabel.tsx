import { type BadgeOption } from '@/@types/common'
import { type MultiValueGenericProps, type GroupBase } from 'react-select'
import classNames from '@/utils/classNames'
import Badge from '@/components/ui/Badge'

export default function MultiValueLabel({
    children,
    data,
}: MultiValueGenericProps<BadgeOption, true, GroupBase<BadgeOption>>) {
    const option: BadgeOption = data
    return (
        <div className="flex items-center">
            {option && <Badge className={classNames('mx-2', option.badgeClass || 'bg-gray-400')} />}
            {children}
        </div>
    )
}
