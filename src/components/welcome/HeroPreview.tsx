import classNames from '@/utils/classNames'

/*
 * A drawn (not screenshotted) preview of the app for the welcome page: the Learn-style table of contents,
 * an article with "In this article", a reference architecture and a generated BRD. Decorative: hidden
 * from screen readers, which get the same story from the page text.
 */

const TOC = [
    { n: '1', label: 'BPP overview', depth: 0 },
    { n: '1.1', label: 'Matrix planning visual', depth: 1, current: true },
    { n: '1.2', label: 'Table edit visual', depth: 1 },
    { n: '2', label: 'Set up a planning cycle', depth: 0 },
    { n: '3', label: 'Implementation gotchas', depth: 0 },
]

const NODES = [
    { x: 8, y: 34, w: 64, label: 'ERP', color: '#64748b' },
    { x: 96, y: 34, w: 72, label: 'Lakehouse', color: '#06b6d4' },
    { x: 192, y: 10, w: 64, label: 'Cube', color: '#8b5cf6' },
    { x: 192, y: 58, w: 64, label: 'Power BI', color: '#f59e0b' },
]

function Line({ className }: { className?: string }) {
    return <div className={classNames('h-2 rounded-full bg-gray-200 dark:bg-gray-700', className)} />
}

export default function HeroPreview() {
    return (
        <div aria-hidden className="relative mx-auto w-full max-w-xl select-none lg:max-w-none">
            {/* Glow */}
            <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-primary/25 via-sky-300/20 to-violet-300/25 blur-2xl dark:from-primary/30 dark:via-sky-500/10 dark:to-violet-500/20" />

            {/* App window */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-primary/10 dark:border-gray-700 dark:bg-gray-900">
                <div className="flex items-center gap-1.5 border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <div className="ml-3 h-5 flex-1 rounded-md bg-white px-2 text-[10px] leading-5 text-gray-400 dark:bg-gray-900">
                        knowledge-hub / knowledge / bpp
                    </div>
                </div>
                <div className="grid grid-cols-[9.5rem_1fr] gap-4 p-4 sm:grid-cols-[11rem_1fr_6.5rem]">
                    {/* Table of contents */}
                    <div className="space-y-1 border-r border-gray-100 pr-3 dark:border-gray-800">
                        <div className="mb-2 text-[11px] font-semibold text-gray-900 dark:text-gray-100">
                            Business performance planning
                        </div>
                        {TOC.map((item) => (
                            <div
                                key={item.n}
                                className={classNames(
                                    'flex items-center gap-1.5 rounded-md py-1 pr-1 text-[10px] leading-tight',
                                    item.depth ? 'pl-4' : 'pl-1',
                                    item.current
                                        ? 'bg-primary-subtle font-semibold text-primary'
                                        : 'text-gray-600 dark:text-gray-400',
                                )}
                            >
                                <span className="tabular-nums opacity-70">{item.n}</span>
                                <span className="truncate">{item.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Article */}
                    <div className="min-w-0 space-y-2.5">
                        <div className="flex gap-1.5">
                            <span className="rounded-md bg-primary-subtle px-1.5 py-0.5 text-[9px] font-semibold text-primary">
                                Concept
                            </span>
                            <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                                BPP
                            </span>
                        </div>
                        <div className="text-sm font-bold text-gray-900 dark:text-gray-50">Matrix planning visual</div>
                        <Line className="w-full" />
                        <Line className="w-11/12" />
                        <Line className="w-4/5" />
                        <div className="rounded-lg border-l-4 border-emerald-500 bg-emerald-50 p-2 dark:bg-emerald-500/10">
                            <div className="mb-1 text-[9px] font-bold text-emerald-700 dark:text-emerald-300">TIP</div>
                            <Line className="w-5/6 bg-emerald-200 dark:bg-emerald-500/30" />
                        </div>
                        <Line className="w-full" />
                        <Line className="w-2/3" />
                    </div>

                    {/* In this article */}
                    <div className="hidden space-y-1.5 border-l border-gray-100 pl-3 sm:block dark:border-gray-800">
                        <div className="text-[9px] font-semibold tracking-wider text-gray-400 uppercase">
                            In this article
                        </div>
                        {['Key capabilities', 'Write-back', 'Allocations', 'Best practices'].map((h, i) => (
                            <div
                                key={h}
                                className={classNames(
                                    'border-l-2 pl-1.5 text-[9px] leading-tight',
                                    i === 1
                                        ? 'border-primary font-semibold text-primary'
                                        : 'border-transparent text-gray-500',
                                )}
                            >
                                {h}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Floating: reference architecture */}
            <div className="welcome-float absolute -bottom-28 -left-8 hidden w-[17rem] rounded-xl border border-gray-200 bg-white p-3 shadow-xl sm:block dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-2 text-[10px] font-semibold text-gray-900 dark:text-gray-100">
                    Reference architecture
                </div>
                <svg viewBox="0 0 264 96" className="h-auto w-full">
                    <g className="stroke-gray-300 dark:stroke-gray-600" strokeWidth="1.5" fill="none">
                        <path d="M72 46 H96" />
                        <path d="M168 46 C180 46 180 22 192 22" />
                        <path d="M168 46 C180 46 180 70 192 70" />
                    </g>
                    {NODES.map((node) => (
                        <g key={node.label}>
                            <rect
                                x={node.x}
                                y={node.y}
                                width={node.w}
                                height={24}
                                rx={6}
                                className="fill-white stroke-gray-200 dark:fill-gray-900 dark:stroke-gray-600"
                            />
                            <rect x={node.x + 6} y={node.y + 8} width={8} height={8} rx={2} fill={node.color} />
                            <text
                                x={node.x + 18}
                                y={node.y + 15.5}
                                className="fill-gray-700 text-[9px] font-semibold dark:fill-gray-200"
                            >
                                {node.label}
                            </text>
                        </g>
                    ))}
                </svg>
            </div>

            {/* Floating: BRD */}
            <div className="welcome-float-delayed absolute -right-4 -bottom-10 hidden rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-xl sm:block dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-xs text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                        ✓
                    </span>
                    <div>
                        <div className="text-[10px] font-semibold text-gray-900 dark:text-gray-100">BRDs generated</div>
                        <div className="text-[9px] text-gray-500">Customer · Internal brief</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
