import classNames from '@/utils/classNames'

interface UserAvatarProps {
    userId: string
    name: string
    size?: number
    className?: string
}

const TONES = [
    'bg-primary-subtle text-primary',
    'bg-success-subtle text-success',
    'bg-warning-subtle text-warning',
    'bg-gold-subtle text-gold',
    'bg-info-subtle text-info',
    'bg-error-subtle text-error',
]

const initials = (name: string) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('') || '?'

/** Initials on a colour picked from the user id (no photos — minimal personal data). */
export default function UserAvatar({ userId, name, size = 36, className }: UserAvatarProps) {
    const tone = TONES[[...userId].reduce((sum, c) => sum + c.charCodeAt(0), 0) % TONES.length]
    return (
        <span
            className={classNames(
                'inline-flex shrink-0 items-center justify-center rounded-full font-semibold',
                tone,
                className,
            )}
            style={{ width: size, height: size, fontSize: Math.max(11, size * 0.38) }}
            aria-hidden
        >
            {initials(name)}
        </span>
    )
}
