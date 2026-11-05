'use client'

import { useEffect, useState } from 'react'
import ErrorState from '@/components/shared/ErrorState'

/** Catches unexpected rendering errors inside the app shell, reports them and offers a retry. */
export default function PortalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    const [reference, setReference] = useState<string | null>(error.digest ?? null)

    useEffect(() => {
        // Same-origin report (the browser never talks to anything else); failures are ignored
        fetch('/api/client-errors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: error.message, digest: error.digest, path: window.location.pathname }),
        })
            .then((r) => (r.ok ? r.json() : null))
            .then((body: { reference?: string } | null) => body?.reference && setReference(body.reference))
            .catch(() => undefined)
    }, [error])

    return (
        <ErrorState
            title="This page hit a snag"
            message={`Something unexpected went wrong while showing this page. Try again — if it keeps happening, tell an administrator${reference ? ` (reference ${reference})` : ''}.`}
            onRetry={reset}
        />
    )
}
