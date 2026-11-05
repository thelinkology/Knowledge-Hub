import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PGlite } from '@electric-sql/pglite'

const MIGRATIONS_DIR = join(__dirname, '..', '..', 'supabase', 'migrations')

/**
 * The parts of Supabase the migrations rely on: the API roles, `auth.users`, `auth.uid()` (which reads the
 * JWT subject the way Supabase does, from `request.jwt.claim.sub`) and the storage buckets table.
 */
const SUPABASE_SHIM = `
    do $$ begin
        if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
        if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
        if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
    end $$;
    create schema auth;
    create schema storage;
    create table storage.buckets (id text primary key, name text not null, public boolean default false, file_size_limit bigint, allowed_mime_types text[]);
    create table auth.users (
        id uuid primary key default gen_random_uuid(),
        email text,
        raw_user_meta_data jsonb not null default '{}'
    );
    create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    grant usage on schema public, auth to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
    alter default privileges in schema public grant select on tables to anon, authenticated;
    alter default privileges in schema public grant all on tables to service_role;
    alter default privileges in schema public grant all on sequences to service_role;
`

/** A fresh in-memory Postgres with every migration applied. */
export async function createTestDb() {
    const db = new PGlite()
    await db.exec(SUPABASE_SHIM)
    for (const file of readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith('.sql'))
        .sort()) {
        try {
            await db.exec(readFileSync(join(MIGRATIONS_DIR, file), 'utf8'))
        } catch (error) {
            throw new Error(`Migration ${file} failed: ${(error as Error).message}`)
        }
    }
    return db
}

export type TestDb = Awaited<ReturnType<typeof createTestDb>>

export type TestRole = 'viewer' | 'editor' | 'admin'

/**
 * Creates an auth user (the sign-up trigger makes the viewer profile) and, like an administrator would,
 * gives it `role`. `metadata` is the sign-up metadata (to check what the trigger ignores). Returns its id.
 */
export async function createUser(
    db: TestDb,
    email: string,
    role: TestRole = 'viewer',
    metadata: Record<string, unknown> = { display_name: email.split('@')[0] },
) {
    const { rows } = await db.query<{ id: string }>(
        `insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id`,
        [email, JSON.stringify(metadata)],
    )
    const id = rows[0].id
    if (role !== 'viewer') await db.query(`update public.profiles set role = $1 where id = $2`, [role, id])
    return id
}

/** Runs `fn` as a signed-in user through the `authenticated` role, so RLS applies. */
export async function asUser<T>(db: TestDb, userId: string, fn: () => Promise<T>): Promise<T> {
    await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${userId}', false);`)
    try {
        return await fn()
    } finally {
        await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`)
    }
}

/** A client (as the server would create it); returns its id */
export async function createClient(db: TestDb, name: string, slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')) {
    const { rows } = await db.query<{ id: string }>(
        `insert into public.clients (name, slug) values ($1, $2) returning id`,
        [name, slug],
    )
    return rows[0].id
}

export interface TestArticle {
    title: string
    summary?: string
    body?: string
    status?: 'draft' | 'published' | 'archived'
    clientId?: string | null
    productId?: string | null
    createdBy?: string | null
}

/** An article (as the server would create it); returns its id */
export async function createArticle(db: TestDb, article: TestArticle) {
    const { rows } = await db.query<{ id: string }>(
        `insert into public.articles (title, summary, body, status, client_id, product_id, created_by, updated_by)
         values ($1, $2, $3, $4, $5, $6, $7, $7) returning id`,
        [
            article.title,
            article.summary ?? '',
            article.body ?? '',
            article.status ?? 'published',
            article.clientId ?? null,
            article.productId ?? null,
            article.createdBy ?? null,
        ],
    )
    return rows[0].id
}

/** A library asset (as the server would create it); returns its id */
export async function createAsset(
    db: TestDb,
    asset: { title: string; body?: string; status?: 'draft' | 'published' | 'archived'; clientId?: string | null },
) {
    const { rows } = await db.query<{ id: string }>(
        `insert into public.library_assets (kind, title, body, status, client_id)
         values ('script', $1, $2, $3, $4) returning id`,
        [asset.title, asset.body ?? '', asset.status ?? 'published', asset.clientId ?? null],
    )
    return rows[0].id
}

/** The id of a seeded product (reference data migration) */
export async function productId(db: TestDb, code = 'fabric') {
    const { rows } = await db.query<{ id: string }>(`select id from public.products where code = $1`, [code])
    return rows[0].id
}
