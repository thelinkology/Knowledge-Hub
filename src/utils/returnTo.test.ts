import { describe, expect, it } from 'vitest'
import { isSafeReturnPath, safeReturnPath } from './returnTo'

describe('return paths after signing in', () => {
    it('accepts same-site paths', () => {
        expect(isSafeReturnPath('/knowledge/articles/123')).toBe(true)
        expect(safeReturnPath('/library?q=x', '/')).toBe('/library?q=x')
    })

    it('refuses other sites and odd values', () => {
        for (const value of ['https://evil.example', '//evil.example', '/\\evil.example', 'knowledge', '', null]) {
            expect(isSafeReturnPath(value)).toBe(false)
        }
        expect(safeReturnPath('//evil.example', '/')).toBe('/')
        expect(isSafeReturnPath(`/${'a'.repeat(600)}`)).toBe(false)
    })
})
