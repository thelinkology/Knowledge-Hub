import useSWR, { type SWRConfiguration } from 'swr'
import api from '@/services/api'
import { tryParseDate } from '@/utils/parse'
import { SWR_ONCE_ONLY } from '@/configs/swr.config'
import type { Client, ClientInput, ClientsQuery, ClientSummary } from '@/@types/clients/Client'
import type { Product, ProductInput } from '@/@types/products/Product'
import type { PersonOption } from '@/@types/users/UserAccount'

const ensureSummary = <T extends ClientSummary>(c: T): T => ({ ...c, updatedAt: tryParseDate(c.updatedAt) as Date })
const ensureClient = (c: Client): Client => ({ ...ensureSummary(c), createdAt: tryParseDate(c.createdAt) as Date })

// ── Clients ──

export const getClientsUrl = ({ q, status }: Partial<ClientsQuery> = {}) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (status) params.set('status', status)
    const s = params.toString()
    return s ? `/clients?${s}` : '/clients'
}

export const apiGetClients = async (query: Partial<ClientsQuery> = {}) =>
    (await api.fetchJson<ClientSummary[]>({ method: 'get', url: getClientsUrl(query) })).map(ensureSummary)

export const useSWRClients = (query: Partial<ClientsQuery> = {}, config?: SWRConfiguration<ClientSummary[]>) =>
    useSWR(getClientsUrl(query), () => apiGetClients(query), { keepPreviousData: true, ...config })

export const getClientUrl = (clientId: string) => `/clients/${clientId}`

export const apiGetClient = async (clientId: string) =>
    ensureClient(await api.fetchJson<Client>({ method: 'get', url: getClientUrl(clientId) }))

export const useSWRClient = (clientId: string | null, config?: SWRConfiguration<Client>) =>
    useSWR(clientId ? getClientUrl(clientId) : null, () => apiGetClient(clientId!), config)

export const apiCreateClient = async (input: ClientInput) =>
    ensureClient(await api.fetchJson<Client>({ method: 'post', url: '/clients', data: input }))

export const apiUpdateClient = async (clientId: string, input: ClientInput) =>
    ensureClient(await api.fetchJson<Client>({ method: 'put', url: getClientUrl(clientId), data: input }))

export const apiDeleteClient = (clientId: string) =>
    api.fetchJson<void>({ method: 'delete', url: getClientUrl(clientId) })

// ── Products (reference data) ──

export const productsUrl = '/products'
export const apiGetProducts = () => api.fetchJson<Product[]>({ method: 'get', url: productsUrl })
export const useSWRProducts = (config?: SWRConfiguration<Product[]>) =>
    useSWR(productsUrl, apiGetProducts, { ...SWR_ONCE_ONLY, ...config })

export const apiCreateProduct = (input: ProductInput) =>
    api.fetchJson<Product>({ method: 'post', url: productsUrl, data: input })

export const apiUpdateProduct = (productId: string, input: ProductInput) =>
    api.fetchJson<Product>({ method: 'put', url: `/admin/products/${productId}`, data: input })

// ── People (owner pickers) ──

export const peopleUrl = '/people'
export const useSWRPeople = (enabled: boolean, config?: SWRConfiguration<PersonOption[]>) =>
    useSWR(enabled ? peopleUrl : null, () => api.fetchJson<PersonOption[]>({ method: 'get', url: peopleUrl }), {
        ...SWR_ONCE_ONLY,
        ...config,
    })
