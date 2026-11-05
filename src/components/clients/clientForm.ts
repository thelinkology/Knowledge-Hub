import type { Client, ClientInput } from '@/@types/clients/Client'

/** Element ids of the client form's fields */
export const CLIENT_FIELD_IDS = {
    name: 'client-name',
    industry: 'client-industry',
    website: 'client-website',
    status: 'client-status',
    products: 'client-products',
    owner: 'client-owner',
    summary: 'client-summary',
    notes: 'client-notes',
} as const

export const emptyClientInput = (): ClientInput => ({
    name: '',
    industry: '',
    website: '',
    summary: '',
    notes: '',
    status: 'active',
    productIds: [],
    ownerId: null,
})

export const toClientInput = (client: Client): ClientInput => ({
    name: client.name,
    industry: client.industry,
    website: client.website,
    summary: client.summary,
    notes: client.notes,
    status: client.status,
    productIds: client.productIds,
    ownerId: client.ownerId,
})
