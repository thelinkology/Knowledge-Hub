import { randomBytes } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import {
    absolutizeMarkdownLinks,
    API_KEY_PREFIX,
    API_KEY_RANDOM_BYTES,
    apiKeyDisplayPrefix,
    isApiKeyFormat,
    readApiKey,
} from './apiKeys'

const newKey = () => `${API_KEY_PREFIX}${randomBytes(API_KEY_RANDOM_BYTES).toString('base64url')}`

describe('API key format', () => {
    it('accepts keys generated the way the server makes them', () => {
        for (let i = 0; i < 20; i++) expect(isApiKeyFormat(newKey())).toBe(true)
    })

    it('rejects anything else', () => {
        const key = newKey()
        for (const value of [
            null,
            undefined,
            '',
            key.slice(0, -1),
            `${key}x`,
            key.replace('kh_', 'sk_'),
            `kh_${'a'.repeat(42)}=`,
            `kh_${'a'.repeat(40)} ab`,
        ]) {
            expect(isApiKeyFormat(value)).toBe(false)
        }
    })

    it('shows only the first 10 characters', () => {
        const key = newKey()
        expect(apiKeyDisplayPrefix(key)).toBe(key.slice(0, 10))
        expect(apiKeyDisplayPrefix(key).startsWith('kh_')).toBe(true)
    })
})

describe('reading the key from a request', () => {
    const key = newKey()

    it('reads Authorization: Bearer (any case)', () => {
        expect(readApiKey(new Headers({ Authorization: `Bearer ${key}` }))).toBe(key)
        expect(readApiKey(new Headers({ authorization: `bearer   ${key}` }))).toBe(key)
    })

    it('reads x-api-key', () => {
        expect(readApiKey(new Headers({ 'X-Api-Key': ` ${key} ` }))).toBe(key)
    })

    it('falls back to x-api-key when Authorization holds something else', () => {
        expect(readApiKey(new Headers({ Authorization: 'Basic abc', 'x-api-key': key }))).toBe(key)
    })

    it('returns null for missing or malformed keys', () => {
        expect(readApiKey(new Headers())).toBeNull()
        expect(readApiKey(new Headers({ Authorization: `Basic ${key}` }))).toBeNull()
        expect(readApiKey(new Headers({ Authorization: 'Bearer nope' }))).toBeNull()
        expect(readApiKey(new Headers({ 'x-api-key': 'nope' }))).toBeNull()
    })
})

describe('absolute links for agents', () => {
    it('makes site-relative links and images absolute', () => {
        expect(
            absolutizeMarkdownLinks(
                'See [setup](/knowledge/articles/1) and ![d](/api/media/2).',
                'https://hub.example.com/',
            ),
        ).toBe(
            'See [setup](https://hub.example.com/knowledge/articles/1) and ![d](https://hub.example.com/api/media/2).',
        )
    })

    it('leaves external and protocol-relative links alone', () => {
        const text = '[a](https://learn.microsoft.com) [b](//cdn.example.com/x) [c](#heading)'
        expect(absolutizeMarkdownLinks(text, 'https://hub.example.com')).toBe(text)
    })
})
