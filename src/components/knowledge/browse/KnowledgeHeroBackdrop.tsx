import HeroBackdrop, { type HeroSparkle, type HeroTile } from '@/components/shared/HeroBackdrop'
import navigationIcon from '@/configs/icons.config'

/*
 * The knowledge banner's backdrop (teal): the kinds of article, floating on the right, below the editors'
 * buttons and clear of the left-aligned heading and search box (so only on extra-wide screens).
 */
const TILES: HeroTile[] = [
    { icon: navigationIcon.howTo, className: 'right-[6%] bottom-[16%] text-teal-600 dark:text-teal-300', delay: '0s' },
    {
        icon: navigationIcon.bestPractice,
        className: 'right-[15%] top-[44%] text-emerald-600 dark:text-emerald-300',
        delay: '-2.2s',
    },
    {
        icon: navigationIcon.concept,
        className: 'right-[24%] bottom-[12%] text-cyan-600 dark:text-cyan-300',
        delay: '-3.6s',
    },
    {
        icon: navigationIcon.troubleshooting,
        className: 'right-[4%] top-[38%] text-sky-600 dark:text-sky-300',
        delay: '-1.1s',
    },
]

const SPARKLES: HeroSparkle[] = [
    { className: 'right-[32%] top-[16%]', delay: '0s' },
    { className: 'right-[11%] top-[24%]', delay: '-2s' },
    { className: 'left-[46%] top-[12%]', delay: '-3.3s' },
    { className: 'right-[19%] bottom-[8%]', delay: '-1.4s' },
]

export default function KnowledgeHeroBackdrop() {
    return <HeroBackdrop tone="teal" tiles={TILES} sparkles={SPARKLES} tilesFrom="xl" />
}
