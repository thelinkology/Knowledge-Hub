import { type BadgeOption } from '@/@types/common'
import { Option as DefaultOption } from '@/components/ui/Select'
import { type OptionProps } from 'react-select'
import Badge from '@/components/ui/Badge'

export default function Option(props: OptionProps<BadgeOption>) {
    return (
        <DefaultOption<BadgeOption>
            {...props}
            customLabel={(option, label) => (
                <span className="flex items-center gap-2">
                    <Badge className={option.badgeClass} />
                    <span className="ml-2 rtl:mr-2">{label}</span>
                </span>
            )}
        />
    )
}
