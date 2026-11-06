/**
 * What a page looks like while it's on its way: a title, a line of text and a few calm blocks, inside the
 * app shell (the side nav and header stay put). It fades in after a short delay, so a fast navigation
 * shows no flicker at all (assets/styles/others/_animations.css → .page-skeleton).
 */
export default function PageSkeleton() {
    return (
        <div className="page-skeleton" role="status" aria-live="polite">
            <span className="sr-only">Loading…</span>
            <div aria-hidden className="space-y-6">
                <div className="space-y-3">
                    <div className="skeleton-bar h-3 w-24" />
                    <div className="skeleton-bar h-7 w-72 max-w-full" />
                    <div className="skeleton-bar h-3 w-[28rem] max-w-full" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="skeleton-block h-24" />
                    ))}
                </div>
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="skeleton-block h-72 lg:col-span-2" />
                    <div className="skeleton-block h-72" />
                </div>
            </div>
        </div>
    )
}
