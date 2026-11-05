/*
 * Agent API keys (Copilot Studio): the key format and how a key is read from a request. Pure, so the server
 * and the tests share it. Keys are only ever accepted in headers — never in query strings, which end up in
 * logs and browser history.
 */

/** Every key starts with this, so leaked keys are easy to recognise (and to scan for) */
export const API_KEY_PREFIX = 'kh_'

/** Bytes of randomness in a key (base64url-encoded: 43 characters) */
export const API_KEY_RANDOM_BYTES = 32

/** How many leading characters are stored and shown to recognise a key ("kh_3f9aQx…") */
export const API_KEY_DISPLAY_LENGTH = 10

/** The header agents send the key in (Copilot Studio / custom connectors: "API key" authentication) */
export const API_KEY_HEADER = 'x-api-key'

const KEY_PATTERN = /^kh_[A-Za-z0-9_-]{43}$/

/** True for a string shaped like one of our keys (says nothing about whether it exists) */
export const isApiKeyFormat = (value: string | null | undefined): value is string =>
    typeof value === 'string' && KEY_PATTERN.test(value)

/** The non-secret part of a key that is stored and listed */
export const apiKeyDisplayPrefix = (secret: string) => secret.slice(0, API_KEY_DISPLAY_LENGTH)

/** Anything with a case-insensitive `get(name)`, like `Headers` */
interface HeaderSource {
    get(name: string): string | null
}

/**
 * The key from `Authorization: Bearer <key>` or `x-api-key: <key>` (in that order). Returns null when
 * neither header holds something shaped like a key, so malformed values never reach the database.
 */
export function readApiKey(headers: HeaderSource): string | null {
    const authorization = headers.get('authorization')?.trim()
    if (authorization) {
        const match = /^Bearer\s+(\S+)$/i.exec(authorization)
        if (match && isApiKeyFormat(match[1])) return match[1]
    }
    const header = headers.get(API_KEY_HEADER)?.trim()
    return isApiKeyFormat(header) ? header : null
}

/**
 * Links and images in Markdown that point at our own pages ("/knowledge/articles/…") become absolute, so an
 * agent can cite them. Other links are left alone.
 */
export const absolutizeMarkdownLinks = (markdown: string, origin: string) =>
    markdown.replace(/(\]\()\/(?!\/)/g, `$1${origin.replace(/\/+$/, '')}/`)
