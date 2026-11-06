'use client'

import dynamic from 'next/dynamic'
import Spinner from '@/components/ui/Spinner'

/**
 * The diagram canvas, loaded in the browser only: React Flow measures the DOM, so it is never rendered on
 * the server (and its code loads only on pages that show a diagram).
 */
const LazyDiagramCanvas = dynamic(() => import('./DiagramCanvas'), {
    ssr: false,
    loading: () => (
        <div
            className="diagram-canvas flex h-[520px] items-center justify-center text-sm text-gray-500 dark:text-gray-400"
            role="status"
        >
            <Spinner size={24} className="mr-2" />
            Loading the diagram…
        </div>
    ),
})

export default LazyDiagramCanvas
