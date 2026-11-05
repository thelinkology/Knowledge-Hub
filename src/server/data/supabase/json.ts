import 'server-only'
import type { Json } from '@/@types/supabase/database.types'

/** A jsonb value as a plain object ({} for anything else) */
export const asObject = (value: Json | unknown): Record<string, unknown> =>
    value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}

/** A jsonb value as an array ([] for anything else) */
export const asArray = (value: Json | unknown): unknown[] => (Array.isArray(value) ? value : [])

/** Any app value as jsonb for an insert/update */
export const toJson = (value: unknown) => value as Json
