import { beforeAll, describe, expect, it } from 'vitest'
import { createArticle, createTestDb, createUser, type TestDb } from './testDb'

/*
 * Sub-articles: parent_id + save_article's parentId (20261106000100) and the tree checks, which run at
 * commit so a whole subtree can move in one transaction (20261106000200). Without a collection there's no
 * tree: the parent is cleared.
 */

let db: TestDb
let editor: string

beforeAll(async () => {
    db = await createTestDb()
    editor = await createUser(db, 'tree.editor@example.com', 'editor')
})

let counter = 0

const collection = async () =>
    (
        await db.query<{ id: string }>(`insert into public.collections (title) values ($1) returning id`, [
            `Collection ${++counter}`,
        ])
    ).rows[0].id

/** An article in `collectionId`, optionally under `parentId` */
const article = async (collectionId: string | null, parentId: string | null = null) => {
    const id = await createArticle(db, { title: `Article ${++counter}` })
    await db.query(`update public.articles set collection_id = $1 where id = $2`, [collectionId, id])
    if (parentId) await db.query(`update public.articles set parent_id = $1 where id = $2`, [parentId, id])
    return id
}

const row = async (id: string) =>
    (
        await db.query<{ collection_id: string | null; parent_id: string | null; version: number }>(
            `select collection_id, parent_id, version from public.articles where id = $1`,
            [id],
        )
    ).rows[0]

const setParent = (id: string, parentId: string | null) =>
    db.query(`update public.articles set parent_id = $1 where id = $2`, [parentId, id])

const save = (id: string, fields: Record<string, unknown>) =>
    db.query(`select public.save_article($1, $2, $3, null)`, [id, JSON.stringify(fields), editor])

describe('check_article_parent', () => {
    it('nests an article under another of the same collection', async () => {
        const c = await collection()
        const parent = await article(c)
        const child = await article(c, parent)
        expect((await row(child)).parent_id).toBe(parent)
    })

    it('refuses a parent that doesn’t exist', async () => {
        const c = await collection()
        const a = await article(c)
        await expect(setParent(a, '00000000-0000-4000-8000-000000000000')).rejects.toThrow(
            /PARENT_NOT_FOUND|foreign key/,
        )
    })

    it('refuses a parent in another collection, and clears a parent on an article without a collection', async () => {
        const [c1, c2] = [await collection(), await collection()]
        const parent = await article(c1)
        const elsewhere = await article(c2)
        await expect(setParent(elsewhere, parent)).rejects.toThrow(/PARENT_ELSEWHERE/)
        const loose = await article(null)
        await setParent(loose, parent)
        expect((await row(loose)).parent_id).toBeNull()
        // …and moving a sub-article to another collection without clearing its parent
        const child = await article(c1, parent)
        await expect(
            db.query(`update public.articles set collection_id = $1 where id = $2`, [c2, child]),
        ).rejects.toThrow(/PARENT_ELSEWHERE/)
    })

    it('refuses cycles (including an article under itself)', async () => {
        const c = await collection()
        const a = await article(c)
        const b = await article(c, a)
        const grandchild = await article(c, b)
        await expect(setParent(a, grandchild)).rejects.toThrow(/ARTICLE_CYCLE/)
        await expect(setParent(a, a)).rejects.toThrow()
        expect((await row(a)).parent_id).toBeNull()
    })

    it('allows five levels below the top and refuses a sixth', async () => {
        const c = await collection()
        let parent = await article(c)
        for (let level = 1; level <= 5; level++) parent = await article(c, parent)
        const tooDeep = await article(c)
        await expect(setParent(tooDeep, parent)).rejects.toThrow(/ARTICLE_TOO_DEEP/)
    })

    it('makes the children top-level when their parent is deleted', async () => {
        const c = await collection()
        const parent = await article(c)
        const child = await article(c, parent)
        await db.query(`delete from public.articles where id = $1`, [parent])
        expect(await row(child)).toMatchObject({ collection_id: c, parent_id: null })
    })
})

describe('save_article with a parent', () => {
    it('sets, keeps and clears the parent', async () => {
        const c = await collection()
        const parent = await article(c)
        const a = await article(c)
        await save(a, { parentId: parent })
        expect((await row(a)).parent_id).toBe(parent)
        await save(a, { title: 'Renamed sub-article' })
        expect((await row(a)).parent_id).toBe(parent)
        await save(a, { parentId: null })
        expect((await row(a)).parent_id).toBeNull()
    })

    it('refuses a parent from another collection', async () => {
        const [c1, c2] = [await collection(), await collection()]
        const parent = await article(c1)
        const a = await article(c2)
        await expect(save(a, { parentId: parent })).rejects.toThrow(/PARENT_ELSEWHERE/)
    })

    it('clears the parent when a sub-article moves to another collection', async () => {
        const [c1, c2] = [await collection(), await collection()]
        const parent = await article(c1)
        const a = await article(c1, parent)
        await save(a, { collectionId: c2 })
        expect(await row(a)).toMatchObject({ collection_id: c2, parent_id: null })
    })

    it('moves an article with its whole subtree to another collection in one call', async () => {
        const [c1, c2] = [await collection(), await collection()]
        const top = await article(c1)
        const a = await article(c1, top)
        const child = await article(c1, a)
        const grandchild = await article(c1, child)
        const sibling = await article(c1, a)
        await save(a, { collectionId: c2, parentId: null })
        expect(await row(a)).toMatchObject({ collection_id: c2, parent_id: null })
        expect(await row(child)).toMatchObject({ collection_id: c2, parent_id: a })
        expect(await row(sibling)).toMatchObject({ collection_id: c2, parent_id: a })
        expect(await row(grandchild)).toMatchObject({ collection_id: c2, parent_id: child })
        expect(await row(top)).toMatchObject({ collection_id: c1, parent_id: null })
    })

    it('flattens the subtree when an article leaves every collection', async () => {
        const c = await collection()
        const a = await article(c)
        const child = await article(c, a)
        const grandchild = await article(c, child)
        await save(a, { collectionId: null })
        for (const id of [a, child, grandchild]) {
            expect(await row(id)).toMatchObject({ collection_id: null, parent_id: null })
        }
    })
})

describe('the server’s tree operations', () => {
    it('rearranges top-down (swap parent and child)', async () => {
        const c = await collection()
        const a = await article(c)
        const b = await article(c, a)
        await setParent(b, null)
        await setParent(a, b)
        expect((await row(a)).parent_id).toBe(b)
        expect((await row(b)).parent_id).toBeNull()
    })

    it('deletes a collection with sub-articles (its articles stay, top-level)', async () => {
        const c = await collection()
        const parent = await article(c)
        const child = await article(c, parent)
        await db.query(`delete from public.collections where id = $1`, [c])
        expect(await row(child)).toMatchObject({ collection_id: null, parent_id: null })
        expect(await row(parent)).toMatchObject({ collection_id: null, parent_id: null })
    })
})
