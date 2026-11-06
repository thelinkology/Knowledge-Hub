import HeroBackdrop, { type HeroSparkle, type HeroTile } from '@/components/shared/HeroBackdrop'
import navigationIcon, { AgentIcon, CodeIcon, DiagramIcon } from '@/configs/icons.config'

/** The home banner's backdrop (blue): what the hub holds, floating near the four corners */
const TILES: HeroTile[] = [
    { icon: navigationIcon.article, className: 'left-[6%] top-[18%] text-primary', delay: '0s' },
    { icon: <CodeIcon />, className: 'left-[12%] bottom-[16%] text-emerald-600 dark:text-emerald-400', delay: '-2.5s' },
    { icon: <DiagramIcon />, className: 'right-[7%] top-[20%] text-violet-600 dark:text-violet-400', delay: '-1.2s' },
    { icon: <AgentIcon />, className: 'right-[13%] bottom-[14%] text-amber-600 dark:text-amber-400', delay: '-3.8s' },
]

const SPARKLES: HeroSparkle[] = [
    { className: 'left-[22%] top-[14%]', delay: '0s' },
    { className: 'right-[24%] top-[12%]', delay: '-1.6s' },
    { className: 'left-[28%] bottom-[12%]', delay: '-3.1s' },
    { className: 'right-[30%] bottom-[18%]', delay: '-2.2s' },
]

export default function HomeHeroBackdrop() {
    return <HeroBackdrop tone="blue" tiles={TILES} sparkles={SPARKLES} />
}
