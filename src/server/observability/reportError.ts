import 'server-only'
import { randomUUID } from 'node:crypto'

/*
 * Error reporting without a third-party SDK. Every unexpected error becomes one structured log line
 * (searchable in Vercel → Logs) with a short reference the user can quote. Set ERROR_WEBHOOK_URL to
 * also send a summary to Slack, Discord or any webhook-based alerting tool (no personal data is sent:
 * no user ids, emails or request bodies).
 */

export interface ErrorContext {
    source: 'server' | 'client'
    /** API route or page path */
    path?: string
    /** Next.js digest for rendering errors */
    digest?: string
}

export function reportError(error: unknown, context: ErrorContext): string {
    const reference = randomUUID().slice(0, 8)
    const err = error instanceof Error ? error : new Error(String(error))
    console.error(
        JSON.stringify({
            level: 'error',
            event: 'app_error',
            reference,
            source: context.source,
            path: context.path,
            digest: context.digest,
            name: err.name,
            message: err.message.slice(0, 1000),
            stack: context.source === 'server' ? err.stack?.split('\n').slice(0, 12).join('\n') : undefined,
            at: new Date().toISOString(),
        }),
    )
    const webhook = process.env.ERROR_WEBHOOK_URL
    if (webhook) {
        const text = `⚠️ Awakening Academy ${context.source} error ${reference}${context.path ? ` on ${context.path}` : ''}: ${err.name}: ${err.message.slice(0, 300)}`
        // Fire and forget: alerting must never slow down or break the request
        void fetch(webhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, content: text }),
            signal: AbortSignal.timeout(3000),
        }).catch(() => undefined)
    }
    return reference
}
