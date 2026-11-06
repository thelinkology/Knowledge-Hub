import PageSkeleton from '@/components/shared/PageSkeleton'

/**
 * Shown the moment someone opens another page, while the server prepares it (the side nav and header stay).
 * Next.js also prefetches it for links on screen, so the switch is instant.
 */
export default function PortalLoading() {
    return <PageSkeleton />
}
