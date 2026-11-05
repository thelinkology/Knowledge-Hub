import { z } from 'zod'

export const CLIENT_STATUSES = ['prospect', 'active', 'inactive'] as const
export type ClientStatus = (typeof CLIENT_STATUSES)[number]

export const clientStatusLabel: Record<ClientStatus, string> = {
    prospect: 'Prospect',
    active: 'Active',
    inactive: 'Inactive',
}

export const clientStatusTagClass: Record<ClientStatus, string> = {
    prospect: 'bg-info-subtle text-info border-transparent',
    active: 'bg-success-subtle text-success border-transparent',
    inactive: 'bg-gray-100 text-gray-500 border-transparent dark:bg-gray-700 dark:text-gray-300',
}

/** A client as listed */
export interface ClientSummary {
    id: string
    name: string
    slug: string
    industry: string
    summary: string
    status: ClientStatus
    productIds: string[]
    ownerName: string | null
    updatedAt: Date
}

/** Counts shown on a client's page */
export interface ClientCounts {
    articles: number
    assets: number
    intakes: number
    brds: number
}

export interface Client extends ClientSummary {
    website: string
    /** Account notes (Markdown) */
    notes: string
    ownerId: string | null
    createdAt: Date
    counts: ClientCounts
}

/** A client in a picker */
export interface ClientOption {
    id: string
    name: string
}

/** POST /api/clients, PUT /api/clients/[clientId] */
export const ClientSchema = z.object({
    name: z.string().trim().min(2, 'Give the client a name').max(120),
    industry: z.string().trim().max(80).default(''),
    website: z
        .string()
        .trim()
        .max(300)
        .refine((url) => url === '' || /^https?:\/\/\S+$/i.test(url), 'Use a full http(s):// address')
        .default(''),
    summary: z.string().trim().max(500).default(''),
    notes: z.string().max(50000).default(''),
    status: z.enum(CLIENT_STATUSES).default('active'),
    productIds: z.array(z.string().uuid()).max(20).default([]),
    ownerId: z.string().uuid().nullable().default(null),
})
export type ClientInput = z.infer<typeof ClientSchema>

export const ClientsQuerySchema = z.object({
    q: z.string().trim().max(100).optional(),
    status: z.enum(CLIENT_STATUSES).optional(),
})
export type ClientsQuery = z.infer<typeof ClientsQuerySchema>
