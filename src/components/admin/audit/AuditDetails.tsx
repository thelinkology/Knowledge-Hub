import classNames from '@/utils/classNames'
import { auditActionLabel } from '@/@types/audit/AuditEvent'

/** "productIds" → "Product ids" */
const humanize = (key: string) => {
    const words = key
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[_-]+/g, ' ')
        .toLowerCase()
    return words.charAt(0).toUpperCase() + words.slice(1)
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    !!value && typeof value === 'object' && !Array.isArray(value)

function formatValue(value: unknown): string {
    if (value === null || value === undefined || value === '') return '—'
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (typeof value === 'number') return value.toLocaleString()
    if (Array.isArray(value)) return value.map(formatValue).join(', ') || '—'
    if (isPlainObject(value)) {
        return Object.entries(value)
            .map(([k, v]) => `${humanize(k)}: ${formatValue(v)}`)
            .join(' · ')
    }
    return String(value)
}

export const getAuditActionLabel = (action: string) => auditActionLabel[action] ?? humanize(action.replace(/\./g, ' '))

interface AuditDetailsProps {
    details: Record<string, unknown>
    className?: string
}

/** An audit event's details as a readable list (nested objects such as before/after become one line each). */
export default function AuditDetails({ details, className }: AuditDetailsProps) {
    const entries = Object.entries(details)
    if (!entries.length)
        return <p className={classNames('text-sm text-gray-500', className)}>No further details recorded.</p>
    return (
        <dl className={classNames('grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[minmax(8rem,auto)_1fr]', className)}>
            {entries.map(([key, value]) => (
                <div key={key} className="contents">
                    <dt className="font-semibold text-gray-700 dark:text-gray-200">{humanize(key)}</dt>
                    <dd className="break-words text-gray-600 dark:text-gray-300">{formatValue(value)}</dd>
                </div>
            ))}
        </dl>
    )
}
