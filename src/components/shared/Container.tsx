import classNames from '@/utils/classNames'
import type { CommonProps } from '@/@types/common'

export default function Container({ className, children, ...rest }: CommonProps) {
    return (
        <div className={classNames('container mx-auto', className)} {...rest}>
            {children}
        </div>
    )
}
