/** Dates arrive from JSON as strings; this turns them back into Date objects (or null) */
export function tryParseDate(value: string | number | Date | null | undefined): Date | null {
    if (value === null || value === undefined || value === '') return null
    const date = value instanceof Date ? value : new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
}

export function tryParseJson<T>(value: string | null | undefined, fallback: T): T {
    if (!value) return fallback
    try {
        return JSON.parse(value) as T
    } catch {
        return fallback
    }
}
