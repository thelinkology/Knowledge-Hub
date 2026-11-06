import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { createTestDb, createUser, type TestDb } from './testDb'
import { DiagramSchema } from '@/@types/library/Diagram'
import { AnswerSchema } from '@/@types/intake/Intake'
import { RuleConditionSchema } from '@/@types/intake/IntakeRule'
import { MilestoneSchema } from '@/@types/brds/Milestone'
import { getOutline } from '@/utils/articleValidation'

/*
 * supabase/seed/sample_data.sql (pasted into the SQL editor for demos) still runs on the current schema,
 * can run twice, and writes data the app accepts: diagrams, answers, rule conditions and milestones
 * validate with the app's schemas, and every reference points at a row that exists.
 */

const SEED = readFileSync(join(__dirname, '..', '..', 'supabase', 'seed', 'sample_data.sql'), 'utf8')
const SAMPLE = `id::text like '5eed0000-%'`

let db: TestDb
let admin: string

const rows = async <T>(sql: string) => (await db.query<T>(sql)).rows
const count = async (table: string) =>
    (await rows<{ n: number }>(`select count(*)::int as n from public.${table} where ${SAMPLE}`))[0].n

beforeAll(async () => {
    db = await createTestDb()
    admin = await createUser(db, 'sample.admin@example.com', 'admin')
    await db.exec(SEED)
})

describe('sample data seed', () => {
    it('adds clients, knowledge, library, intakes and BRDs, authored by the administrator', async () => {
        expect(await count('clients')).toBe(4)
        expect(await count('collections')).toBe(7)
        expect(await count('articles')).toBe(41)
        expect(await count('library_assets')).toBe(18)
        expect(await count('intakes')).toBe(3)
        expect(await count('brds')).toBe(3)
        expect(await count('intake_rules')).toBe(6)
        const authors = await rows<{ created_by: string }>(
            `select distinct created_by from public.articles where ${SAMPLE}`,
        )
        expect(authors).toEqual([{ created_by: admin }])
    })

    it('can run again without duplicating anything', async () => {
        await db.exec(SEED)
        expect(await count('articles')).toBe(41)
        expect(await count('library_assets')).toBe(18)
        const revisions = await rows<{ n: number }>(
            `select count(*)::int as n from public.article_revisions where article_id::text like '5eed0000-%'`,
        )
        expect(revisions[0].n).toBe(41)
    })

    it('nests sub-articles and gives every published article an “In this article” outline', async () => {
        const articles = await rows<{ title: string; body: string; status: string; parent_id: string | null }>(
            `select title, body, status, parent_id from public.articles where ${SAMPLE}`,
        )
        expect(articles.filter((a) => a.parent_id).length).toBeGreaterThanOrEqual(10)
        for (const article of articles.filter((a) => a.status === 'published')) {
            expect(getOutline(article.body).length, article.title).toBeGreaterThan(0)
        }
    })

    it('stores diagrams the designer accepts, using component types that exist', async () => {
        const kinds = new Set(
            (await rows<{ code: string }>(`select code from public.diagram_components`)).map((r) => r.code),
        )
        const assets = await rows<{ title: string; diagram: unknown }>(
            `select title, diagram from public.library_assets where ${SAMPLE} and kind = 'reference_architecture'`,
        )
        expect(assets).toHaveLength(5)
        for (const asset of assets) {
            const parsed = DiagramSchema.safeParse(asset.diagram)
            expect(parsed.success, `${asset.title}: ${parsed.error?.message}`).toBe(true)
            for (const node of parsed.data?.views.flatMap((v) => v.nodes) ?? []) {
                expect(kinds.has(node.kind), `${asset.title}: ${node.kind}`).toBe(true)
            }
        }
    })

    it('writes intake answers, rule conditions and milestones the app can read', async () => {
        const questionKeys = new Set(
            (await rows<{ key: string }>(`select key from public.intake_questions`)).map((r) => r.key),
        )
        for (const { answers } of await rows<{ answers: Record<string, unknown> }>(
            `select answers from public.intakes where ${SAMPLE}`,
        )) {
            expect(z.record(z.string(), AnswerSchema).safeParse(answers).success).toBe(true)
            for (const key of Object.keys(answers)) expect(questionKeys.has(key), key).toBe(true)
        }

        const rules = await rows<{ title: string; conditions: unknown[]; article_ids: string[]; asset_ids: string[] }>(
            `select title, conditions, article_ids, asset_ids from public.intake_rules where ${SAMPLE}`,
        )
        for (const rule of rules) {
            for (const condition of rule.conditions) {
                const parsed = RuleConditionSchema.parse(condition)
                expect(questionKeys.has(parsed.questionKey), rule.title).toBe(true)
            }
            const linked = await rows<{ n: number }>(
                `select (select count(*) from public.articles where id = any('{${rule.article_ids.join(',')}}'::uuid[]))::int
                      + (select count(*) from public.library_assets where id = any('{${rule.asset_ids.join(',')}}'::uuid[]))::int as n`,
            )
            expect(linked[0].n, rule.title).toBe(rule.article_ids.length + rule.asset_ids.length)
        }

        for (const { milestones } of await rows<{ milestones: unknown }>(
            `select milestones from public.brds where ${SAMPLE}`,
        )) {
            expect(z.array(MilestoneSchema).safeParse(milestones).success).toBe(true)
        }
    })
})
