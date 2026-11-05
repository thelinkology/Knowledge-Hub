const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Route ids are UUIDs; anything else is a 404 before it reaches the database */
export const isUuid = (value: string | null | undefined): value is string => !!value && UUID.test(value)
