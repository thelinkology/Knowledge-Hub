import classNames from '@/utils/classNames'
import { portalShortName } from '@/configs/app.config'
import type { CommonProps } from '@/@types/common'

export interface LogoProps extends CommonProps {
    type?: 'full' | 'streamline'
    mode?: 'light' | 'dark'
    imgClass?: string
    /** Height of the mark in px */
    size?: number
}

/** Placeholder mark: an open book with a spark — swap for the company logo (public/ + this file). */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
    return (
        <svg viewBox="0 0 40 40" width={size} height={size} className={className} aria-hidden>
            <rect x="2" y="2" width="36" height="36" rx="9" fill="var(--primary)" />
            <path
                d="M10 13.5c3.5-1.5 7-1.2 10 1v14c-3-2.2-6.5-2.5-10-1z M30 13.5c-3.5-1.5-7-1.2-10 1v14c3-2.2 6.5-2.5 10-1z"
                fill="none"
                stroke="var(--neutral)"
                strokeWidth="2"
                strokeLinejoin="round"
            />
            <circle cx="29" cy="9.5" r="2.2" fill="var(--neutral)" />
        </svg>
    )
}

const Logo = ({ type = 'full', className, imgClass, size = 32, style }: LogoProps) => (
    <div className={classNames('logo flex items-center gap-2.5', className)} style={style}>
        <LogoMark size={size} className={imgClass} />
        {type === 'full' && (
            <span className="text-[15px] font-bold leading-tight text-gray-900 dark:text-gray-50">
                {portalShortName}
            </span>
        )}
    </div>
)

export default Logo
