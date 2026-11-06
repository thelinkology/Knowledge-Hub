import { beforeAll, describe, expect, it } from 'vitest'
import { asUser, createTestDb, createUser, type TestDb } from './testDb'
import { DIAGRAM_COLORS, DIAGRAM_ICON_KEYS } from '@/@types/library/DiagramComponent'

/*
 * Architecture diagram component types (20261106000300): the seeded built-in types, the column checks,
 * read access for every signed-in user and no writes from the browser roles.
 */

let db: TestDb
let viewer: string
let editor: string

beforeAll(async () => {
    db = await createTestDb()
    viewer = await createUser(db, 'components.viewer@example.com')
    editor = await createUser(db, 'components.editor@example.com', 'editor')
})

const insert = (fields: Record<string, unknown>) => {
    const row = { code: `custom_${Math.random().toString(36).slice(2, 8)}`, name: 'Custom', ...fields }
    const columns = Object.keys(row)
    return db.query<{ id: string }>(
        `insert into public.diagram_components (${columns.join(', ')}) values (${columns.map((_, i) => `$${i + 1}`).join(', ')}) returning *`,
        Object.values(row),
    )
}

describe('diagram_components', () => {
    it('seeds the twelve built-in types with the codes existing diagrams use, in palette order', async () => {
        const { rows } = await db.query<{ code: string; color: string; icon: string }>(
            `select code, color, icon from public.diagram_components order by position`,
        )
        expect(rows.map((r) => r.code)).toEqual([
            'source_system',
            'database',
            'cube',
            'dimension',
            'procedure',
            'fact',
            'report',
            'person',
            'action',
            'pipeline',
            'service',
            'file',
        ])
        // Every seeded colour and icon is one the app knows
        for (const row of rows) {
            expect(DIAGRAM_COLORS).toContain(row.color)
            expect(DIAGRAM_ICON_KEYS).toContain(row.icon)
        }
    })

    it('checks codes, names, colours and image links', async () => {
        await expect(insert({ code: 'Bad Code' })).rejects.toThrow()
        await expect(insert({ code: 'cube' })).rejects.toThrow(/duplicate|unique/)
        await expect(insert({ name: '   ' })).rejects.toThrow()
        await expect(insert({ color: 'red' })).rejects.toThrow()
        await expect(insert({ image_url: 'http://example.com/a.png' })).rejects.toThrow()
        await expect(insert({ image_url: 'javascript:alert(1)' })).rejects.toThrow()
        const ok = await insert({
            image_url: '/api/media/0b8f0d4e-8e2a-4d55-9c1f-3a4f1b2c3d4e',
            color: 'teal',
            icon: 'api',
        })
        expect(ok.rows).toHaveLength(1)
        await expect(insert({ image_url: 'https://cdn.example.com/logo.png' })).resolves.toBeTruthy()
    })

    it('lets every signed-in user read the types', async () => {
        const { rows } = await asUser(db, viewer, () =>
            db.query<{ count: number }>(`select count(*)::int as count from public.diagram_components`),
        )
        expect(rows[0].count).toBeGreaterThanOrEqual(12)
    })

    it('refuses writes from the browser roles (even editors: writes go through the server)', async () => {
        await expect(
            asUser(db, editor, () =>
                db.query(`insert into public.diagram_components (code, name) values ('sneaky', 'Sneaky')`),
            ),
        ).rejects.toThrow(/permission denied/)
        await expect(
            asUser(db, editor, () => db.query(`update public.diagram_components set name = 'Renamed'`)),
        ).rejects.toThrow(/permission denied/)
        await expect(asUser(db, editor, () => db.query(`delete from public.diagram_components`))).rejects.toThrow(
            /permission denied/,
        )
    })

    it('keeps diagrams intact when a type is deleted (nodes only refer to the code)', async () => {
        const { rows } = await insert({ code: 'to_delete', name: 'To delete' })
        const diagram = {
            views: [{ id: 'v1', name: 'Main', nodes: [{ id: 'n1', kind: 'to_delete', label: 'X', x: 0, y: 0 }] }],
        }
        const asset = await db.query<{ id: string }>(
            `insert into public.library_assets (kind, title, diagram) values ('reference_architecture', 'Arch', $1) returning id`,
            [JSON.stringify(diagram)],
        )
        await db.query(`delete from public.diagram_components where id = $1`, [rows[0].id])
        const after = await db.query<{ diagram: typeof diagram }>(
            `select diagram from public.library_assets where id = $1`,
            [asset.rows[0].id],
        )
        expect(after.rows[0].diagram.views[0].nodes[0].kind).toBe('to_delete')
    })
})
