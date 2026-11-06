import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { asUser, createTestDb, createUser, type TestDb } from './testDb'

/*
 * Migration 20261106000400_client_access: viewers read shared knowledge plus their own clients'; the
 * library and other clients are hidden from them; API keys move from one client to several.
 */

let db: TestDb

const ids = (rows: { id: string }[]) => rows.map((r) => r.id).sort()

async function client(name: string) {
    const slug = name.toLowerCase()
    return (
        await db.query<{ id: string }>(`insert into public.clients (name, slug) values ($1, $2) returning id`, [
            name,
            slug,
        ])
    ).rows[0].id
}

async function article(title: string, clientId: string | null, status = 'published') {
    return (
        await db.query<{ id: string }>(
            `insert into public.articles (title, client_id, status) values ($1, $2, $3::public.publish_status) returning id`,
            [title, clientId, status],
        )
    ).rows[0].id
}

describe('client access for viewers', () => {
    let viewer: string
    let loneViewer: string
    let editor: string
    let contoso: string
    let fabrikam: string
    const a: Record<string, string> = {}

    beforeAll(async () => {
        db = await createTestDb()
        viewer = await createUser(db, 'viewer@example.com')
        loneViewer = await createUser(db, 'lone@example.com')
        editor = await createUser(db, 'editor@example.com', 'editor')
        contoso = await client('Contoso')
        fabrikam = await client('Fabrikam')
        await db.query(`insert into public.client_members (client_id, user_id) values ($1, $2)`, [contoso, viewer])
        a.shared = await article('Shared article', null)
        a.contoso = await article('Contoso article', contoso)
        a.fabrikam = await article('Fabrikam article', fabrikam)
        a.contosoDraft = await article('Contoso draft', contoso, 'draft')
        await db.query(
            `insert into public.library_assets (title, kind, status) values ('Shared script', 'script', 'published')`,
        )
    })

    afterAll(async () => {
        await db.close()
    })

    const visible = (userId: string, table: 'articles' | 'clients') =>
        asUser(db, userId, async () => ids((await db.query<{ id: string }>(`select id from public.${table}`)).rows))

    it('lets a viewer read shared knowledge plus their own clients’ published articles', async () => {
        expect(await visible(viewer, 'articles')).toEqual([a.shared, a.contoso].sort())
    })

    it('gives a viewer without clients shared knowledge only', async () => {
        expect(await visible(loneViewer, 'articles')).toEqual([a.shared])
    })

    it('lets editors read every client, drafts included', async () => {
        expect(await visible(editor, 'articles')).toEqual(Object.values(a).sort())
    })

    it('shows a viewer only their own clients', async () => {
        expect(await visible(viewer, 'clients')).toEqual([contoso])
        expect(await visible(loneViewer, 'clients')).toEqual([])
        expect(await visible(editor, 'clients')).toEqual([contoso, fabrikam].sort())
    })

    it('keeps the library from viewers', async () => {
        const count = (userId: string) =>
            asUser(db, userId, async () => (await db.query(`select id from public.library_assets`)).rows.length)
        expect(await count(viewer)).toBe(0)
        expect(await count(editor)).toBe(1)
    })

    it('lets a viewer see their own memberships only, and change none', async () => {
        await db.query(`insert into public.client_members (client_id, user_id) values ($1, $2)`, [fabrikam, editor])
        const rows = await asUser(
            db,
            viewer,
            async () => (await db.query<{ user_id: string }>(`select user_id from public.client_members`)).rows,
        )
        expect(rows.map((r) => r.user_id)).toEqual([viewer])
        await expect(
            asUser(db, viewer, () =>
                db.query(`insert into public.client_members (client_id, user_id) values ($1, $2)`, [fabrikam, viewer]),
            ),
        ).rejects.toThrow(/permission denied/)
    })

    it('drops memberships with the client', async () => {
        const temp = await client('Tailspin')
        await db.query(`insert into public.client_members (client_id, user_id) values ($1, $2)`, [temp, viewer])
        await db.query(`delete from public.clients where id = $1`, [temp])
        const { rows } = await db.query(`select 1 from public.client_members where client_id = $1`, [temp])
        expect(rows).toEqual([])
    })
})

describe('API keys move to several clients', () => {
    it('keeps what existing keys could read', async () => {
        // Apply the migrations before 000400, add keys the old way, then apply 000400
        const dir = join(__dirname, '..', '..', 'supabase', 'migrations')
        const isBefore = (file: string) => file < '20261106000400'
        const rest = readdirSync(dir)
            .filter((f) => f.endsWith('.sql') && !isBefore(f))
            .sort()
        const fresh = await createTestDb(isBefore)
        try {
            const contoso = (
                await fresh.query<{ id: string }>(
                    `insert into public.clients (name, slug) values ('Contoso', 'contoso') returning id`,
                )
            ).rows[0].id
            await fresh.query(
                `insert into public.api_keys (name, prefix, key_hash, client_id) values
                    ('Client key', 'kh_aaaaaaa', repeat('a', 64), $1),
                    ('Everything key', 'kh_bbbbbbb', repeat('b', 64), null)`,
                [contoso],
            )
            for (const file of rest) await fresh.exec(readFileSync(join(dir, file), 'utf8'))

            const { rows } = await fresh.query<{ name: string; all_clients: boolean; clients: string[] | null }>(
                `select k.name, k.all_clients, array_remove(array_agg(c.client_id), null) as clients
                 from public.api_keys k left join public.api_key_clients c on c.api_key_id = k.id
                 group by k.name, k.all_clients order by k.name`,
            )
            expect(rows).toEqual([
                { name: 'Client key', all_clients: false, clients: [contoso] },
                { name: 'Everything key', all_clients: true, clients: [] },
            ])
        } finally {
            await fresh.close()
        }
    })

    it('hides key clients from every signed-in role', async () => {
        const local = await createTestDb()
        try {
            const admin = await createUser(local, 'admin@example.com', 'admin')
            await expect(
                asUser(local, admin, () => local.query(`select * from public.api_key_clients`)),
            ).rejects.toThrow(/permission denied/)
        } finally {
            await local.close()
        }
    })
})
