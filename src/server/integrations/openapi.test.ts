import { describe, expect, it } from 'vitest'
import { buildOpenApiSpec } from './openapi'

type Json = Record<string, unknown>

const operations = (spec: Json) =>
    Object.values(spec.paths as Record<string, Record<string, Json>>).flatMap((path) => Object.values(path))

describe('agent OpenAPI document', () => {
    const spec = buildOpenApiSpec('hub.example.com')

    it('is Swagger 2.0 for the request host over https', () => {
        expect(spec.swagger).toBe('2.0')
        expect(spec.host).toBe('hub.example.com')
        expect(spec.basePath).toBe('/api/v1')
        expect(spec.schemes).toEqual(['https'])
        expect(buildOpenApiSpec('localhost:3000').schemes).toEqual(['http'])
    })

    it('authenticates with the x-api-key header', () => {
        expect(spec.securityDefinitions).toEqual({ apiKey: { type: 'apiKey', in: 'header', name: 'x-api-key' } })
        expect(spec.security).toEqual([{ apiKey: [] }])
    })

    it('names every operation and describes it and its parameters', () => {
        const ops = operations(spec)
        expect(ops.map((op) => op.operationId).sort()).toEqual([
            'GetArticle',
            'GetAsset',
            'ListClients',
            'SearchKnowledge',
        ])
        for (const op of ops) {
            expect(op.summary).toBeTruthy()
            expect(String(op.description).length).toBeGreaterThan(60)
            for (const parameter of op.parameters as Json[]) expect(parameter.description).toBeTruthy()
        }
    })

    it('only refers to definitions that exist', () => {
        const refs = JSON.stringify(spec).match(/#\/definitions\/\w+/g) ?? []
        const definitions = spec.definitions as Json
        for (const r of refs) expect(definitions[r.replace('#/definitions/', '')]).toBeDefined()
    })

    it('declares path parameters for every {placeholder}', () => {
        for (const [path, item] of Object.entries(spec.paths as Record<string, Record<string, Json>>)) {
            const placeholders = [...path.matchAll(/\{(\w+)\}/g)].map((m) => m[1])
            for (const op of Object.values(item)) {
                const pathParams = (op.parameters as Json[]).filter((p) => p.in === 'path').map((p) => p.name)
                expect(pathParams).toEqual(placeholders)
            }
        }
    })
})
