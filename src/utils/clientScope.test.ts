import { describe, expect, it } from 'vitest'
import { clientScopeFilter, inClientScope, searchClientIds } from './clientScope'

const A = '11111111-1111-4111-8111-111111111111'
const B = '22222222-2222-4222-8222-222222222222'

describe('client scope', () => {
    it('reads shared knowledge always, and clients only within the scope', () => {
        expect(inClientScope([A], null)).toBe(true)
        expect(inClientScope([A], A)).toBe(true)
        expect(inClientScope([A], B)).toBe(false)
        expect(inClientScope([], B)).toBe(false)
        expect(inClientScope(null, B)).toBe(true)
    })

    it('builds the PostgREST filter, dropping anything that is not a UUID', () => {
        expect(clientScopeFilter([A, B])).toBe(`client_id.is.null,client_id.in.(${A},${B})`)
        expect(clientScopeFilter([])).toBe('client_id.is.null')
        expect(clientScopeFilter(['x),id.neq.(0'])).toBe('client_id.is.null')
    })

    it('narrows a search to one client inside the scope, and refuses one outside it', () => {
        expect(searchClientIds(null)).toBeNull()
        expect(searchClientIds([A])).toEqual([A])
        expect(searchClientIds([A], A)).toEqual([A])
        expect(searchClientIds([A], B)).toBeUndefined()
        expect(searchClientIds(null, B)).toEqual([B])
    })
})
