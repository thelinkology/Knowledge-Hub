import { beforeAll, describe, expect, it } from 'vitest'
import {
    asUser,
    createArticle,
    createAsset,
    createClient,
    createTestDb,
    createUser,
    productId,
    type TestDb,
} from './testDb'

let db: TestDb
let viewer: string
let editor: string
let admin: string

beforeAll(async () => {
    db = await createTestDb()
    viewer = await createUser(db, 'viewer@example.com')
    editor = await createUser(db, 'editor@example.com', 'editor')
    admin = await createUser(db, 'admin@example.com', 'admin')
})

const ids = (rows: { id: string }[]) => rows.map((r) => r.id).sort()

describe('sign-up (handle_new_user)', () => {
    it('creates a viewer profile with the display name', async () => {
        const id = await createUser(db, 'new.person@example.com', 'viewer', { display_name: '  Ada  ' })
        const { rows } = await db.query<{ role: string; display_name: string; email: string }>(
            `select role, display_name, email from public.profiles where id = $1`,
            [id],
        )
        expect(rows[0]).toEqual({ role: 'viewer', display_name: 'Ada', email: 'new.person@example.com' })
    })

    it('ignores a role in the sign-up metadata', async () => {
        const id = await createUser(db, 'sneaky@example.com', 'viewer', { display_name: 'Eve', role: 'admin' })
        const { rows } = await db.query<{ role: string }>(`select role from public.profiles where id = $1`, [id])
        expect(rows[0].role).toBe('viewer')
    })

    it('falls back to the email name without a display name', async () => {
        const id = await createUser(db, 'grace.h@example.com', 'viewer', {})
        const { rows } = await db.query<{ display_name: string }>(
            `select display_name from public.profiles where id = $1`,
            [id],
        )
        expect(rows[0].display_name).toBe('grace.h')
    })
})

describe('row level security', () => {
    let published: string
    let draft: string

    beforeAll(async () => {
        published = await createArticle(db, { title: 'RLS published', status: 'published' })
        draft = await createArticle(db, { title: 'RLS draft', status: 'draft' })
        await db.query(
            `insert into public.api_keys (name, prefix, key_hash) values ('Test key', 'kh_abcdefg', repeat('a', 64))`,
        )
    })

    const visibleArticles = (userId: string) =>
        asUser(db, userId, async () =>
            ids(
                (
                    await db.query<{ id: string }>(`select id from public.articles where id in ($1, $2)`, [
                        published,
                        draft,
                    ])
                ).rows,
            ),
        )

    it('lets a viewer read published articles but not drafts', async () => {
        expect(await visibleArticles(viewer)).toEqual([published])
    })

    it('lets editors and admins read drafts too', async () => {
        expect(await visibleArticles(editor)).toEqual([published, draft].sort())
        expect(await visibleArticles(admin)).toEqual([published, draft].sort())
    })

    it('denies every browser-role write to articles', async () => {
        for (const userId of [viewer, editor, admin]) {
            await expect(
                asUser(db, userId, () => db.query(`insert into public.articles (title) values ('Sneaky insert')`)),
            ).rejects.toThrow(/permission denied/)
            await expect(
                asUser(db, userId, () =>
                    db.query(`update public.articles set title = 'Changed' where id = $1`, [published]),
                ),
            ).rejects.toThrow(/permission denied/)
            await expect(
                asUser(db, userId, () => db.query(`delete from public.articles where id = $1`, [published])),
            ).rejects.toThrow(/permission denied/)
        }
        const { rows } = await db.query<{ title: string }>(`select title from public.articles where id = $1`, [
            published,
        ])
        expect(rows[0].title).toBe('RLS published')
    })

    it('lets nobody signed in read API keys, not even an admin', async () => {
        for (const userId of [viewer, editor, admin]) {
            await expect(asUser(db, userId, () => db.query(`select key_hash from public.api_keys`))).rejects.toThrow(
                /permission denied/,
            )
        }
    })

    it('keeps revisions from viewers', async () => {
        await db.query(
            `insert into public.article_revisions (article_id, version, title, summary, body) values ($1, 1, 't', '', '')`,
            [published],
        )
        const count = (userId: string) =>
            asUser(db, userId, async () =>
                Number(
                    (
                        await db.query<{ n: number }>(
                            `select count(*)::int as n from public.article_revisions where article_id = $1`,
                            [published],
                        )
                    ).rows[0].n,
                ),
            )
        expect(await count(viewer)).toBe(0)
        expect(await count(editor)).toBe(1)
    })
})

describe('save_article', () => {
    it('saves, increments the version and snapshots a revision', async () => {
        const articleId = await createArticle(db, { title: 'Before', body: 'Old body', status: 'draft' })
        const { rows } = await db.query<{ version: number }>(
            `select public.save_article($1, $2::jsonb, $3, 1) as version`,
            [articleId, JSON.stringify({ title: 'After', body: 'New body', tags: ['fabric', 'gateway'] }), editor],
        )
        expect(rows[0].version).toBe(2)

        const article = (
            await db.query<{ title: string; body: string; version: number; tags: string[]; updated_by: string }>(
                `select title, body, version, tags, updated_by from public.articles where id = $1`,
                [articleId],
            )
        ).rows[0]
        expect(article).toEqual({
            title: 'After',
            body: 'New body',
            version: 2,
            tags: ['fabric', 'gateway'],
            updated_by: editor,
        })

        const revisions = (
            await db.query<{ version: number; title: string; body: string; saved_by: string }>(
                `select version, title, body, saved_by from public.article_revisions where article_id = $1 order by version`,
                [articleId],
            )
        ).rows
        expect(revisions).toEqual([{ version: 2, title: 'After', body: 'New body', saved_by: editor }])
    })

    it('refuses a save based on an older version (ARTICLE_CHANGED) and changes nothing', async () => {
        const articleId = await createArticle(db, { title: 'Shared draft', status: 'draft' })
        await db.query(`select public.save_article($1, '{"title": "First editor"}'::jsonb, $2, 1)`, [articleId, editor])
        await expect(
            db.query(`select public.save_article($1, '{"title": "Second editor"}'::jsonb, $2, 1)`, [articleId, admin]),
        ).rejects.toThrow(/ARTICLE_CHANGED/)
        const { rows } = await db.query<{ title: string; version: number }>(
            `select title, version from public.articles where id = $1`,
            [articleId],
        )
        expect(rows[0]).toEqual({ title: 'First editor', version: 2 })
    })

    it('skips the check when no version is expected, and reports a missing article', async () => {
        const articleId = await createArticle(db, { title: 'Restore me', status: 'draft' })
        const { rows } = await db.query<{ version: number }>(
            `select public.save_article($1, '{"title": "Restored"}'::jsonb, $2, null) as version`,
            [articleId, editor],
        )
        expect(rows[0].version).toBe(2)
        await expect(
            db.query(`select public.save_article(gen_random_uuid(), '{}'::jsonb, $1, null)`, [editor]),
        ).rejects.toThrow(/ARTICLE_NOT_FOUND/)
    })

    it('can only be called by the server', async () => {
        const articleId = await createArticle(db, { title: 'Guarded', status: 'draft' })
        await expect(
            asUser(db, admin, () =>
                db.query(`select public.save_article($1, '{}'::jsonb, $2, null)`, [articleId, admin]),
            ),
        ).rejects.toThrow(/permission denied/)
    })
})

describe('search_knowledge', () => {
    let contoso: string
    let fabrikam: string
    const created: Record<string, string> = {}

    interface Hit {
        item_type: string
        id: string
        status: string
        snippet: string
    }

    const search = async (
        query: string,
        {
            clientId = null,
            includeDrafts = false,
            types = ['article', 'asset'],
            product = null,
        }: {
            clientId?: string | null
            includeDrafts?: boolean
            types?: string[]
            product?: string | null
        } = {},
    ) =>
        (
            await db.query<Hit>(`select * from public.search_knowledge($1, $2, $3, $4, $5, 50)`, [
                query,
                clientId,
                product,
                types,
                includeDrafts,
            ])
        ).rows

    beforeAll(async () => {
        contoso = await createClient(db, 'Contoso')
        fabrikam = await createClient(db, 'Fabrikam')
        const fabric = await productId(db, 'fabric')
        created.shared = await createArticle(db, {
            title: 'Gateway refresh failures',
            body: 'When the on-premises gateway times out, the dataset refresh fails. Restart the gateway service.',
            productId: fabric,
        })
        created.contoso = await createArticle(db, {
            title: 'Contoso gateway cluster',
            body: 'Contoso runs a two-node gateway cluster in Azure.',
            clientId: contoso,
        })
        created.fabrikam = await createArticle(db, {
            title: 'Fabrikam gateway notes',
            body: 'Fabrikam uses a personal gateway for finance.',
            clientId: fabrikam,
        })
        created.draft = await createArticle(db, {
            title: 'Gateway upgrade checklist',
            body: 'Unfinished gateway upgrade steps.',
            status: 'draft',
        })
        created.archived = await createArticle(db, { title: 'Old gateway guide', body: 'gateway', status: 'archived' })
        created.asset = await createAsset(db, {
            title: 'Gateway health check script',
            body: 'Checks every gateway node.',
        })
        created.unrelated = await createArticle(db, { title: 'Acterys write-back', body: 'Planning input templates.' })
    })

    it('finds published articles and assets that match, with a bold snippet', async () => {
        const hits = await search('gateway')
        expect(ids(hits)).toEqual([created.shared, created.contoso, created.fabrikam, created.asset].sort())
        expect(hits.every((h) => h.status === 'published')).toBe(true)
        expect(hits.find((h) => h.id === created.shared)?.snippet).toContain('**gateway**')
        expect(hits.find((h) => h.id === created.asset)?.item_type).toBe('asset')
    })

    it('excludes drafts unless asked to include them (never archived items)', async () => {
        expect(ids(await search('gateway'))).not.toContain(created.draft)
        const withDrafts = ids(await search('gateway', { includeDrafts: true }))
        expect(withDrafts).toContain(created.draft)
        expect(withDrafts).not.toContain(created.archived)
    })

    it('limits a client to its own and shared knowledge', async () => {
        const hits = ids(await search('gateway', { clientId: contoso }))
        expect(hits).toEqual([created.shared, created.contoso, created.asset].sort())
        expect(hits).not.toContain(created.fabrikam)
    })

    it('filters by type and product', async () => {
        expect(ids(await search('gateway', { types: ['asset'] }))).toEqual([created.asset])
        expect(ids(await search('gateway', { product: await productId(db, 'fabric') }))).toEqual([created.shared])
    })

    it('returns nothing for an empty or unmatched query', async () => {
        expect(await search('')).toEqual([])
        expect(await search('kubernetes')).toEqual([])
    })

    it('can only be called by the server', async () => {
        await expect(asUser(db, viewer, () => search('gateway'))).rejects.toThrow(/permission denied/)
    })
})
