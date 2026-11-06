import 'server-only'
import { agentApiBasePath, portalName } from '@/configs/app.config'
import { API_KEY_HEADER } from '@/utils/apiKeys'
import { ARTICLE_KINDS } from '@/@types/knowledge/ArticleKindOptions'
import { ASSET_KINDS } from '@/@types/library/Asset'

/*
 * The agent API described as Swagger 2.0 (OpenAPI 2.0) — the version Copilot Studio REST API tools and Power
 * Platform custom connectors import. Summaries and descriptions are written for a language model: they are
 * how the agent decides which tool to call and what to pass.
 */

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }
type JsonObject = { [key: string]: JsonValue }

export interface SwaggerDocument extends JsonObject {
    swagger: '2.0'
    info: JsonObject
    host: string
    basePath: string
    schemes: string[]
    paths: JsonObject
    definitions: JsonObject
    securityDefinitions: JsonObject
}

const ref = (name: string): JsonObject => ({ $ref: `#/definitions/${name}` })

const string = (description: string, extra: JsonObject = {}): JsonObject => ({ type: 'string', description, ...extra })

const nullableRef = (name: string, description: string): JsonObject => ({
    ...ref(name),
    description,
    'x-nullable': true,
})

const errorResponses = (notFound?: string): JsonObject => ({
    ...(notFound ? { 404: { description: notFound, schema: ref('Error') } } : {}),
    400: { description: 'A parameter is missing or not valid. The message says which.', schema: ref('Error') },
    401: { description: 'The API key is missing, wrong or revoked.', schema: ref('Error') },
    429: { description: 'Too many requests for this key. Wait and retry.', schema: ref('Error') },
})

const DEFINITIONS: JsonObject = {
    ClientRef: {
        type: 'object',
        description: 'The client a piece of knowledge belongs to.',
        properties: {
            id: string('Client id (UUID).'),
            slug: string('Client slug, usable as the `client` search filter.'),
            name: string('Client name.'),
        },
    },
    ProductRef: {
        type: 'object',
        description: 'The product or platform the knowledge is about.',
        properties: {
            id: string('Product id (UUID).'),
            code: string('Product code, usable as the `product` search filter (e.g. "fabric").'),
            name: string('Product name (e.g. "Microsoft Fabric").'),
        },
    },
    SearchResult: {
        type: 'object',
        properties: {
            id: string(
                'Id of the article or asset. Pass it to GetArticle (type "article") or GetAsset (type "asset").',
            ),
            type: string(
                '"article" (knowledge article) or "asset" (library asset: script, reference architecture, demo asset…).',
                {
                    enum: ['article', 'asset'],
                },
            ),
            title: string('Title.'),
            summary: string('One or two sentence summary.'),
            snippet: string('The passage that matched the query, Markdown, matched words in **bold**.'),
            kind: string(`Article kind (${ARTICLE_KINDS.join(', ')}) or asset kind (${ASSET_KINDS.join(', ')}).`),
            client: nullableRef(
                'ClientRef',
                'The client it is specific to; null means shared knowledge for every client.',
            ),
            product: nullableRef('ProductRef', 'The product it is about; null when not product specific.'),
            updatedAt: string('When it was last updated (ISO 8601).', { format: 'date-time' }),
            url: string('Link to the page in Knowledge Hub. Cite it when you use this result.'),
        },
    },
    SearchResponse: {
        type: 'object',
        properties: {
            results: {
                type: 'array',
                description: 'Best matches first. Empty when nothing published matches.',
                items: ref('SearchResult'),
            },
        },
    },
    Article: {
        type: 'object',
        properties: {
            id: string('Article id.'),
            title: string('Title.'),
            summary: string('Summary.'),
            kind: string('What sort of article it is.', { enum: [...ARTICLE_KINDS] }),
            audience: string('"internal" (delivery team only) or "customer" (may be shared with customers).', {
                enum: ['internal', 'customer'],
            }),
            client: nullableRef('ClientRef', 'The client it is specific to; null means shared knowledge.'),
            product: nullableRef('ProductRef', 'The product it is about, if any.'),
            tags: { type: 'array', items: { type: 'string' }, description: 'Keywords.' },
            updatedAt: string('Last updated (ISO 8601).', { format: 'date-time' }),
            url: string('Link to the article in Knowledge Hub. Cite it.'),
            content: string('The full article body in Markdown.'),
            parent: nullableRef(
                'ArticleRef',
                'The article this one sits under in the table of contents; null at the top level. Call GetArticle ' +
                    'with its id for the broader context.',
            ),
            children: {
                type: 'array',
                description:
                    'Its sub-articles in reading order (may be empty). Call GetArticle with an id for the details.',
                items: ref('ArticleChild'),
            },
        },
    },
    ArticleRef: {
        type: 'object',
        description: 'A related knowledge article.',
        properties: {
            id: string('Article id. Pass it to GetArticle.'),
            title: string('Title.'),
            url: string('Link to the article in Knowledge Hub.'),
        },
    },
    ArticleChild: {
        type: 'object',
        description: 'A sub-article.',
        properties: {
            id: string('Article id. Pass it to GetArticle.'),
            title: string('Title.'),
            summary: string('Summary.'),
            url: string('Link to the article in Knowledge Hub.'),
        },
    },
    Asset: {
        type: 'object',
        properties: {
            id: string('Asset id.'),
            title: string('Title.'),
            summary: string('Summary.'),
            kind: string('What sort of asset it is.', { enum: [...ASSET_KINDS] }),
            client: nullableRef('ClientRef', 'The client it is specific to; null means shared.'),
            product: nullableRef('ProductRef', 'The product it is for, if any.'),
            tags: { type: 'array', items: { type: 'string' }, description: 'Keywords.' },
            updatedAt: string('Last updated (ISO 8601).', { format: 'date-time' }),
            url: string('Link to the asset in Knowledge Hub. Cite it.'),
            content: string('How to use the asset, in Markdown.'),
            code: string('The script or code snippet itself (may be empty). Show it in a code block.'),
            codeLanguage: string('Language of `code` (sql, dax, m, python, powershell, json, yaml…), or empty.'),
            link: string('Where the asset lives (repository, SharePoint, demo tenant), or empty.'),
            diagramMarkdown: string(
                'For a reference architecture: its architecture diagram in Markdown — per view (scenario) the ' +
                    'components grouped by type, the connections ("A → B (label)"), the numbered build sequence ' +
                    'with build guidance, and notes. Empty when the asset has no diagram. Use it to explain how ' +
                    'the solution fits together and in which order to build it.',
            ),
        },
    },
    Client: {
        type: 'object',
        properties: {
            id: string('Client id.'),
            slug: string('Client slug — pass it as `client` to SearchKnowledge.'),
            name: string('Client name.'),
            industry: string('Industry.'),
            summary: string('Short description of the client.'),
            status: string('Relationship status.', { enum: ['prospect', 'active', 'inactive'] }),
        },
    },
    ClientsResponse: {
        type: 'object',
        properties: { clients: { type: 'array', items: ref('Client') } },
    },
    Error: {
        type: 'object',
        properties: {
            error: string('What went wrong and what to do about it.'),
            code: string('Machine-readable error code.'),
        },
    },
}

const idParameter = (name: string, description: string): JsonObject => ({
    name,
    in: 'path',
    required: true,
    type: 'string',
    format: 'uuid',
    description,
    'x-ms-summary': 'Id',
})

/** The Swagger 2.0 document for `host` (e.g. "hub.contoso.com") */
export function buildOpenApiSpec(host: string): SwaggerDocument {
    const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)
    return {
        swagger: '2.0',
        info: {
            title: `${portalName} knowledge API`,
            version: '1.0',
            description:
                'Read-only access to the delivery team’s PUBLISHED knowledge base: how-to guides, best practices, ' +
                'troubleshooting, concepts and reference material, plus a library of reusable scripts, Power Automate ' +
                'flows, reference architectures and demo assets for Acterys, BPP, Microsoft Fabric, Power BI and Power ' +
                'Platform. Content is Markdown. Every item has a `url` to cite. Authenticate with an API key in the ' +
                `\`${API_KEY_HEADER}\` header.`,
        },
        host,
        basePath: agentApiBasePath,
        // Copilot Studio and Power Platform only call https endpoints; http is offered for local testing only
        schemes: local ? ['http'] : ['https'],
        produces: ['application/json'],
        securityDefinitions: { apiKey: { type: 'apiKey', in: 'header', name: API_KEY_HEADER } },
        security: [{ apiKey: [] }],
        paths: {
            '/knowledge/search': {
                get: {
                    operationId: 'SearchKnowledge',
                    summary: 'Search the knowledge base',
                    description:
                        'Search the team’s published knowledge base: how-to guides, best practices, troubleshooting, ' +
                        'reference architectures and sample scripts for Acterys, BPP, Microsoft Fabric, Power BI and ' +
                        'Power Platform, including client-specific delivery notes. Call this FIRST for any question about ' +
                        'how to do something, a known issue, a recommended approach or a reusable asset. Returns the best ' +
                        'matches with a summary and a matching snippet; then call GetArticle or GetAsset with a result’s ' +
                        'id to read it in full before answering.',
                    parameters: [
                        {
                            name: 'q',
                            in: 'query',
                            required: true,
                            type: 'string',
                            description:
                                'What to search for, in a few keywords (e.g. "fabric gateway refresh error", "acterys ' +
                                'write-back setup"). Supports quoted phrases, OR, and -word to exclude.',
                            'x-ms-summary': 'Search query',
                        },
                        {
                            name: 'client',
                            in: 'query',
                            required: false,
                            type: 'string',
                            description:
                                'Only knowledge for this client (plus shared knowledge that applies to every client). ' +
                                'A client slug from ListClients (e.g. "contoso"), or a client id. Leave empty to search ' +
                                'everything you can access.',
                            'x-ms-summary': 'Client',
                        },
                        {
                            name: 'product',
                            in: 'query',
                            required: false,
                            type: 'string',
                            description:
                                'Only knowledge about this product, by code: "acterys", "bpp", "fabric", "power-bi", ' +
                                '"power-platform" (or a product id). Leave empty unless the question is clearly about one ' +
                                'product.',
                            'x-ms-summary': 'Product',
                        },
                        {
                            name: 'type',
                            in: 'query',
                            required: false,
                            type: 'string',
                            enum: ['all', 'article', 'asset'],
                            default: 'all',
                            description:
                                '"article" for guides and explanations, "asset" for reusable scripts, flows, reference ' +
                                'architectures and demo assets, "all" (default) for both.',
                            'x-ms-summary': 'Type',
                        },
                        {
                            name: 'limit',
                            in: 'query',
                            required: false,
                            type: 'integer',
                            minimum: 1,
                            maximum: 25,
                            default: 8,
                            description: 'Maximum number of results (1–25, default 8).',
                            'x-ms-summary': 'Limit',
                        },
                    ],
                    responses: {
                        200: { description: 'Matching published items, best first.', schema: ref('SearchResponse') },
                        ...errorResponses('The client or product filter doesn’t match anything you can access.'),
                    },
                },
            },
            '/knowledge/articles/{articleId}': {
                get: {
                    operationId: 'GetArticle',
                    summary: 'Read a knowledge article',
                    description:
                        'Get the full Markdown content of a published knowledge article by id (from SearchKnowledge ' +
                        'results of type "article"). Use it to answer with the article’s actual steps and details, and ' +
                        'cite its `url`.',
                    parameters: [idParameter('articleId', 'The article id from a SearchKnowledge result.')],
                    responses: {
                        200: { description: 'The article.', schema: ref('Article') },
                        ...errorResponses('No published article with that id is available to this key.'),
                    },
                },
            },
            '/library/assets/{assetId}': {
                get: {
                    operationId: 'GetAsset',
                    summary: 'Read a library asset',
                    description:
                        'Get a published library asset by id (from SearchKnowledge results of type "asset"): a reusable ' +
                        'script, reference architecture, component, template or demo asset. Returns how to use it ' +
                        '(Markdown), the code snippet if any, where it lives and, for a reference architecture, its ' +
                        'architecture diagram as Markdown (components, connections and build sequence).',
                    parameters: [idParameter('assetId', 'The asset id from a SearchKnowledge result.')],
                    responses: {
                        200: { description: 'The asset.', schema: ref('Asset') },
                        ...errorResponses('No published asset with that id is available to this key.'),
                    },
                },
            },
            '/clients': {
                get: {
                    operationId: 'ListClients',
                    summary: 'List clients',
                    description:
                        'List the clients whose knowledge you can access, with their slug, industry and a short ' +
                        'summary. Call it when the user mentions a client by name, to get the slug to pass as `client` ' +
                        'to SearchKnowledge.',
                    parameters: [],
                    responses: {
                        200: { description: 'The clients.', schema: ref('ClientsResponse') },
                        ...errorResponses(),
                    },
                },
            },
        },
        definitions: DEFINITIONS,
    }
}
