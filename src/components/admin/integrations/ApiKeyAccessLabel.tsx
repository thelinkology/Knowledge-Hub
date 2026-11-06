import type { ApiKey } from '@/@types/integrations/ApiKey'

/** What a key reads, in words: "All clients", "Shared knowledge only", or "Contoso, Fabrikam + shared" */
export const describeApiKeyAccess = (apiKey: Pick<ApiKey, 'allClients' | 'clients'>) =>
    apiKey.allClients
        ? 'all published knowledge, for every client'
        : apiKey.clients.length
          ? `shared knowledge plus ${apiKey.clients.map((c) => c.name).join(', ')}`
          : 'shared knowledge only'

/** The "Can read" cell of the keys table */
export default function ApiKeyAccessLabel({ apiKey }: { apiKey: ApiKey }) {
    if (apiKey.allClients) return <span className="text-gray-600 dark:text-gray-300">All clients</span>
    if (!apiKey.clients.length) return <span className="text-gray-600 dark:text-gray-300">Shared knowledge only</span>
    return (
        <span className="flex max-w-xs flex-wrap gap-1.5">
            {apiKey.clients.map((client) => (
                <span
                    key={client.id}
                    className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                >
                    {client.name}
                </span>
            ))}
            <span className="block w-full text-xs text-gray-500">+ shared knowledge</span>
        </span>
    )
}
