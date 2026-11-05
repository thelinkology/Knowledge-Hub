import Link, { type LinkProps } from 'next/link'
import Card from '@/components/ui/Card'
import { type IconType } from 'react-icons/lib'
import classNames from '@/utils/classNames'
import { ControlSize } from '@/@types/theme'

const cardLinkClassNames =
    'flex flex-col overflow-hidden rounded-xl shadow-lg transform transition duration-300 hover:scale-105' //w-full h-full bg-white dark:bg-gray-800

export interface CardLinkProps extends LinkProps {
    className?: string
    children: React.ReactNode
}
const CardLink = ({ className, children, ...linkProps }: CardLinkProps) => (
    <Link {...linkProps}>
        <Card className={classNames(cardLinkClassNames, className)}>{children}</Card>
    </Link>
)
export default CardLink

export interface CardLinkImageProps extends LinkProps {
    href: string
    target?: string
    className?: string
    bodyClassName?: string
    size?: ControlSize
    imageClassName?: string
    src: string
    alt?: string
    label?: string
    children?: React.ReactNode
}
const CardLinkImage = ({
    className,
    bodyClassName,
    size,
    imageClassName,
    src,
    alt,
    label,
    children,
    ...linkProps
}: CardLinkImageProps) => (
    <Link {...linkProps}>
        <Card
            className={classNames(cardLinkClassNames, !size || size === 'md' ? 'min-w-48' : '', className)}
            bodyClass={classNames('flex flex-col items-center', bodyClassName)}
        >
            <img
                src={src}
                alt={alt || label || ''}
                className={classNames(
                    'w-full h-32 object-cover',
                    !size || size === 'md' ? `w-[100px] h-[100px]` : '',
                    imageClassName,
                )}
            />
            {label && <div className="mt-2 text-center">{label}</div>}
            {children}
        </Card>
    </Link>
)
export { CardLinkImage }

export interface CardLinkIconProps extends LinkProps {
    href: string
    target?: string
    className?: string
    bodyClassName?: string
    size?: ControlSize
    iconClassName?: string
    icon?: IconType
    label?: string
    children?: React.ReactNode
}
const CardLinkIcon = ({
    className,
    bodyClassName,
    iconClassName,
    size,
    icon: Icon,
    label,
    children,
    ...linkProps
}: CardLinkIconProps) => (
    <Link {...linkProps}>
        <Card
            className={classNames(cardLinkClassNames, !size || size === 'md' ? 'w-48 h-48' : '', className)}
            bodyClass={classNames('h-full flex flex-col items-center justify-center', bodyClassName)}
        >
            {Icon && (
                <Icon
                    className={classNames(
                        'w-full h-32 object-cover',
                        !size || size === 'md' ? `w-[100px] h-[100px]` : '',
                        iconClassName,
                    )}
                />
            )}
            {label && <div className="mt-2 text-center">{label}</div>}
            {children}
        </Card>
    </Link>
)
export { CardLinkIcon }
