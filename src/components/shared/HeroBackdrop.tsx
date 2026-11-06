import type { ReactNode } from 'react'
import classNames from '@/utils/classNames'

/*
 * Decoration behind a page's banner (home, knowledge): soft colour glows that drift slowly, a few small
 * tiles bobbing in free space, twinkling sparkles and a faint dashed line. Purely decorative (hidden from
 * screen readers, never clickable). For people who prefer reduced motion nothing moves: the glows and
 * sparkles only fade gently (assets/styles/others/_hero.css). Put it first inside a `relative isolate
 * overflow-hidden` section.
 */

export type HeroTone = 'blue' | 'teal'

export interface HeroTile {
    icon: ReactNode
    /** Position and icon colour */
    className: string
    /** Animation delay (negative = already part-way through), so the tiles don't move together */
    delay: string
}

export interface HeroSparkle {
    className: string
    delay: string
}

interface HeroBackdropProps {
    tone: HeroTone
    tiles: HeroTile[]
    sparkles: HeroSparkle[]
    /** From which screen width the tiles show (they need free space beside the text) */
    tilesFrom?: 'lg' | 'xl'
}

// Whole class names so Tailwind keeps them
const TONES: Record<HeroTone, { orbs: [string, string, string]; sparkle: string; line: string }> = {
    blue: {
        orbs: [
            'bg-primary/20 dark:bg-primary/25',
            'bg-violet-300/30 dark:bg-violet-500/15',
            'bg-sky-200/40 dark:bg-emerald-300/10',
        ],
        sparkle: 'text-primary/60',
        line: 'text-primary/20 dark:text-white/10',
    },
    teal: {
        orbs: [
            'bg-teal-300/35 dark:bg-teal-400/15',
            'bg-cyan-200/50 dark:bg-cyan-400/10',
            'bg-emerald-200/45 dark:bg-primary/20',
        ],
        sparkle: 'text-teal-500/70 dark:text-teal-300/70',
        line: 'text-teal-600/25 dark:text-teal-200/15',
    },
}

function Sparkle({ className, delay }: HeroSparkle) {
    return (
        <svg
            viewBox="0 0 16 16"
            className={classNames('hero-twinkle absolute h-3 w-3', className)}
            style={{ animationDelay: delay }}
        >
            <path
                fill="currentColor"
                d="M8 0c.4 3.9 1.9 5.6 8 8-6.1 2.4-7.6 4.1-8 8-.4-3.9-1.9-5.6-8-8 6.1-2.4 7.6-4.1 8-8z"
            />
        </svg>
    )
}

export default function HeroBackdrop({ tone, tiles, sparkles, tilesFrom = 'lg' }: HeroBackdropProps) {
    const colors = TONES[tone]
    return (
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden select-none">
            {/* Drifting glows */}
            <div
                className={classNames(
                    'hero-orb hero-orb-a absolute -top-24 -left-16 h-72 w-72 rounded-full blur-3xl',
                    colors.orbs[0],
                )}
            />
            <div
                className={classNames(
                    'hero-orb hero-orb-b absolute -right-20 -bottom-28 h-80 w-80 rounded-full blur-3xl',
                    colors.orbs[1],
                )}
            />
            <div
                className={classNames(
                    'hero-orb hero-orb-c absolute top-1/3 left-[calc(50%-7rem)] h-56 w-56 rounded-full blur-3xl',
                    colors.orbs[2],
                )}
            />

            {/* A faint connector sweeping across, fading out behind the text in the middle */}
            <svg
                className={classNames('hero-line-wrap absolute inset-0 hidden h-full w-full md:block', colors.line)}
                preserveAspectRatio="none"
                viewBox="0 0 1000 300"
            >
                <path
                    className="hero-line"
                    d="M40 230 C 220 120, 330 280, 500 170 S 800 60, 960 110"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                />
            </svg>

            {/* Small tiles in the free space (wide screens only, away from the text) */}
            {tiles.map((tile, index) => (
                <span
                    key={index}
                    className={classNames(
                        'hero-tile absolute hidden h-11 w-11 items-center justify-center rounded-xl border border-white/70 bg-white/80 text-xl shadow-lg shadow-primary/10 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80',
                        tilesFrom === 'xl' ? 'xl:flex' : 'lg:flex',
                        tile.className,
                    )}
                    style={{ animationDelay: tile.delay }}
                >
                    {tile.icon}
                </span>
            ))}

            {sparkles.map((sparkle, index) => (
                <Sparkle key={index} className={classNames(colors.sparkle, sparkle.className)} delay={sparkle.delay} />
            ))}
        </div>
    )
}
