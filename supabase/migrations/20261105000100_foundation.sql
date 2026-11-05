-- ════════════════════════════════════════════════════════════════════════════════════════════════
-- Knowledge Hub — foundation schema
--
-- Security model
--   • The browser never writes to the database. Every write goes through a Next.js API route, which
--     authorises the user and then uses the service-role client (server/data/supabase/admin.ts).
--   • RLS is still enabled on every table: it scopes what a signed-in user can READ through the
--     publishable key, and denies all writes (no insert/update/delete policies exist for `authenticated`).
--   • Copilot Studio (and any other agent) reads knowledge through /api/v1 with an API key; the key's hash
--     lives in api_keys and is checked on the server. Agents never get database credentials.
-- ════════════════════════════════════════════════════════════════════════════════════════════════

-- ── Enums ─────────────────────────────────────────────────────────────────────────────────────────

create type public.app_role as enum ('viewer', 'editor', 'admin');

create type public.publish_status as enum ('draft', 'published', 'archived');

create type public.client_status as enum ('prospect', 'active', 'inactive');

create type public.article_kind as enum ('concept', 'how_to', 'tutorial', 'reference', 'troubleshooting', 'best_practice');

-- Who the knowledge is written for. Customer-facing content may be quoted in customer BRDs.
create type public.audience as enum ('internal', 'customer');

create type public.asset_kind as enum (
    'script', 'flow', 'reference_architecture', 'demo_asset', 'component', 'template'
);

create type public.question_type as enum ('text', 'long_text', 'single_choice', 'multi_choice', 'yes_no', 'number');

create type public.rule_kind as enum ('gotcha', 'best_practice');

create type public.intake_status as enum ('draft', 'in_review', 'complete');

create type public.brd_status as enum ('draft', 'final');

-- ── Shared trigger: updated_at ────────────────────────────────────────────────────────────────────

create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
    new.updated_at := now();
    return new;
end $$;

-- ── Profiles ──────────────────────────────────────────────────────────────────────────────────────

create table public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    email text not null,
    display_name text not null check (char_length(display_name) between 1 and 60),
    role public.app_role not null default 'viewer',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index profiles_email_idx on public.profiles (lower(email));

create trigger profiles_updated_at before update on public.profiles
    for each row execute function public.set_updated_at();

-- Every new account is a viewer. Roles are granted by an administrator, never taken from sign-up data.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
    insert into public.profiles (id, email, display_name, role)
    values (
        new.id,
        coalesce(new.email, ''),
        left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1), 'User'), 60),
        'viewer'
    );
    return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
    for each row execute function public.handle_new_user();

-- ── Products (Acterys, BPP, Fabric …) ─────────────────────────────────────────────────────────────
-- Admin-configurable. `milestone_template` seeds the milestones of a BRD that includes the product.

create table public.products (
    id uuid primary key default gen_random_uuid(),
    code text not null unique check (code ~ '^[a-z0-9-]{2,40}$'),
    name text not null check (char_length(name) between 2 and 60),
    description text not null default '' check (char_length(description) <= 500),
    -- A key into ProductThemeOptions.ts (colour), not a colour value
    theme text not null default 'blue',
    milestone_template jsonb not null default '[]' check (jsonb_typeof(milestone_template) = 'array'),
    active boolean not null default true,
    sort_order smallint not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger products_updated_at before update on public.products
    for each row execute function public.set_updated_at();

-- ── Clients ───────────────────────────────────────────────────────────────────────────────────────

create table public.clients (
    id uuid primary key default gen_random_uuid(),
    name text not null check (char_length(name) between 2 and 120),
    slug text not null unique check (slug ~ '^[a-z0-9-]{2,80}$'),
    industry text not null default '' check (char_length(industry) <= 80),
    website text not null default '' check (char_length(website) <= 300),
    summary text not null default '' check (char_length(summary) <= 500),
    notes text not null default '' check (char_length(notes) <= 50000),
    status public.client_status not null default 'active',
    product_ids uuid[] not null default '{}',
    owner_id uuid references public.profiles (id) on delete set null,
    created_by uuid references public.profiles (id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index clients_name_idx on public.clients (lower(name));

create trigger clients_updated_at before update on public.clients
    for each row execute function public.set_updated_at();

-- ── Knowledge: collections and articles (like Microsoft Learn modules and units) ──────────────────
-- client_id null = shared knowledge (all clients); otherwise specific to one client.

create table public.collections (
    id uuid primary key default gen_random_uuid(),
    client_id uuid references public.clients (id) on delete cascade,
    product_id uuid references public.products (id) on delete set null,
    title text not null check (char_length(title) between 2 and 150),
    summary text not null default '' check (char_length(summary) <= 500),
    status public.publish_status not null default 'draft',
    position integer not null default 0,
    created_by uuid references public.profiles (id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index collections_client_idx on public.collections (client_id);

create trigger collections_updated_at before update on public.collections
    for each row execute function public.set_updated_at();

create table public.articles (
    id uuid primary key default gen_random_uuid(),
    collection_id uuid references public.collections (id) on delete set null,
    client_id uuid references public.clients (id) on delete cascade,
    product_id uuid references public.products (id) on delete set null,
    kind public.article_kind not null default 'concept',
    audience public.audience not null default 'internal',
    title text not null check (char_length(title) between 2 and 200),
    summary text not null default '' check (char_length(summary) <= 500),
    body text not null default '' check (char_length(body) <= 200000),
    tags text[] not null default '{}',
    status public.publish_status not null default 'draft',
    position integer not null default 0,
    version integer not null default 1,
    published_at timestamptz,
    created_by uuid references public.profiles (id) on delete set null,
    updated_by uuid references public.profiles (id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    search tsvector generated always as (
        setweight(to_tsvector('english'::regconfig, coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english'::regconfig, coalesce(summary, '')), 'B') ||
        setweight(to_tsvector('english'::regconfig, coalesce(body, '')), 'C')
    ) stored
);

create index articles_collection_idx on public.articles (collection_id, position);
create index articles_client_idx on public.articles (client_id);
create index articles_status_idx on public.articles (status, updated_at desc);
create index articles_search_idx on public.articles using gin (search);
create index articles_tags_idx on public.articles using gin (tags);

create trigger articles_updated_at before update on public.articles
    for each row execute function public.set_updated_at();

-- A snapshot of every saved version, so editors can see and restore what changed
create table public.article_revisions (
    id uuid primary key default gen_random_uuid(),
    article_id uuid not null references public.articles (id) on delete cascade,
    version integer not null,
    title text not null,
    summary text not null,
    body text not null,
    saved_by uuid references public.profiles (id) on delete set null,
    created_at timestamptz not null default now(),
    unique (article_id, version)
);

-- ── Library: sample scripts, flows, reference architectures, demo assets ──────────────────────────

create table public.library_assets (
    id uuid primary key default gen_random_uuid(),
    client_id uuid references public.clients (id) on delete cascade,
    product_id uuid references public.products (id) on delete set null,
    kind public.asset_kind not null,
    title text not null check (char_length(title) between 2 and 200),
    summary text not null default '' check (char_length(summary) <= 500),
    -- How to use it (Markdown, edited with the same editor as articles)
    body text not null default '' check (char_length(body) <= 100000),
    -- Where it lives (repo, SharePoint, demo tenant …); https only
    url text not null default '' check (url = '' or url ~* '^https://'),
    -- An optional snippet (script, DAX, Python, JSON flow definition …)
    code text not null default '' check (char_length(code) <= 100000),
    code_language text not null default '' check (char_length(code_language) <= 30),
    tags text[] not null default '{}',
    status public.publish_status not null default 'draft',
    created_by uuid references public.profiles (id) on delete set null,
    updated_by uuid references public.profiles (id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    search tsvector generated always as (
        setweight(to_tsvector('english'::regconfig, coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english'::regconfig, coalesce(summary, '')), 'B') ||
        setweight(to_tsvector('english'::regconfig, coalesce(body, '')), 'C')
    ) stored
);

create index library_assets_client_idx on public.library_assets (client_id);
create index library_assets_kind_idx on public.library_assets (kind, updated_at desc);
create index library_assets_search_idx on public.library_assets using gin (search);

create trigger library_assets_updated_at before update on public.library_assets
    for each row execute function public.set_updated_at();

-- ── Images used in articles, assets and BRDs (private bucket, served through /api/media/[id]) ─────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('knowledge-media', 'knowledge-media', false, 5242880, array['image/png', 'image/jpeg', 'image/gif', 'image/webp'])
on conflict (id) do nothing;

create table public.knowledge_media (
    id uuid primary key default gen_random_uuid(),
    storage_path text not null unique,
    file_name text not null check (char_length(file_name) between 1 and 120),
    content_type text not null,
    size_bytes integer not null check (size_bytes > 0),
    uploaded_by uuid references public.profiles (id) on delete set null,
    created_at timestamptz not null default now()
);

create index knowledge_media_created_idx on public.knowledge_media (created_at desc);

-- ── Requirements intake ───────────────────────────────────────────────────────────────────────────
-- Questions are admin-configurable. product_id set = only asked when that product is in scope.
-- options: [{ "value": "...", "label": "..." }] for choice questions.

create table public.intake_questions (
    id uuid primary key default gen_random_uuid(),
    key text not null unique check (key ~ '^[a-z][a-z0-9_]{1,59}$'),
    section text not null check (char_length(section) between 2 and 80),
    label text not null check (char_length(label) between 2 and 300),
    help text not null default '' check (char_length(help) <= 1000),
    type public.question_type not null default 'text',
    options jsonb not null default '[]' check (jsonb_typeof(options) = 'array'),
    required boolean not null default false,
    product_id uuid references public.products (id) on delete cascade,
    position integer not null default 0,
    active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger intake_questions_updated_at before update on public.intake_questions
    for each row execute function public.set_updated_at();

-- IF/ELSE guidance: when an intake's answers meet the conditions, the rule's guidance and links are
-- added to the BRDs. conditions: [{ "questionKey", "operator", "value" }] (see @types/intake/IntakeRule.ts).
create table public.intake_rules (
    id uuid primary key default gen_random_uuid(),
    title text not null check (char_length(title) between 2 and 200),
    kind public.rule_kind not null default 'gotcha',
    product_id uuid references public.products (id) on delete cascade,
    match text not null default 'all' check (match in ('all', 'any')),
    conditions jsonb not null default '[]' check (jsonb_typeof(conditions) = 'array'),
    guidance text not null default '' check (char_length(guidance) <= 20000),
    -- Best practices may be shown to the customer; gotchas stay internal
    show_to_customer boolean not null default false,
    article_ids uuid[] not null default '{}',
    asset_ids uuid[] not null default '{}',
    active boolean not null default true,
    position integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger intake_rules_updated_at before update on public.intake_rules
    for each row execute function public.set_updated_at();

create table public.intakes (
    id uuid primary key default gen_random_uuid(),
    client_id uuid not null references public.clients (id) on delete cascade,
    title text not null check (char_length(title) between 2 and 200),
    status public.intake_status not null default 'draft',
    product_ids uuid[] not null default '{}',
    answers jsonb not null default '{}' check (jsonb_typeof(answers) = 'object'),
    notes text not null default '' check (char_length(notes) <= 20000),
    created_by uuid references public.profiles (id) on delete set null,
    updated_by uuid references public.profiles (id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index intakes_client_idx on public.intakes (client_id, updated_at desc);

create trigger intakes_updated_at before update on public.intakes
    for each row execute function public.set_updated_at();

-- ── BRDs (customer-facing and internal) ───────────────────────────────────────────────────────────

create table public.brds (
    id uuid primary key default gen_random_uuid(),
    client_id uuid not null references public.clients (id) on delete cascade,
    intake_id uuid references public.intakes (id) on delete set null,
    audience public.audience not null,
    title text not null check (char_length(title) between 2 and 200),
    status public.brd_status not null default 'draft',
    body text not null default '' check (char_length(body) <= 200000),
    -- [{ "title", "deliverables": [], "dependencies": [], "owner", "due" }]
    milestones jsonb not null default '[]' check (jsonb_typeof(milestones) = 'array'),
    created_by uuid references public.profiles (id) on delete set null,
    updated_by uuid references public.profiles (id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index brds_client_idx on public.brds (client_id, updated_at desc);
create index brds_intake_idx on public.brds (intake_id);

create trigger brds_updated_at before update on public.brds
    for each row execute function public.set_updated_at();

-- ── Agent access (Copilot Studio) ─────────────────────────────────────────────────────────────────
-- Only the SHA-256 of a key is stored; the key itself is shown once when it's created.

create table public.api_keys (
    id uuid primary key default gen_random_uuid(),
    name text not null check (char_length(name) between 2 and 80),
    prefix text not null check (char_length(prefix) between 4 and 20),
    key_hash text not null unique check (key_hash ~ '^[0-9a-f]{64}$'),
    -- Restricts the key to one client's knowledge (plus shared knowledge); null = everything published
    client_id uuid references public.clients (id) on delete cascade,
    created_by uuid references public.profiles (id) on delete set null,
    created_at timestamptz not null default now(),
    last_used_at timestamptz,
    revoked_at timestamptz
);

-- ── Ops ───────────────────────────────────────────────────────────────────────────────────────────

create table public.audit_events (
    id uuid primary key default gen_random_uuid(),
    actor_id uuid references public.profiles (id) on delete set null,
    action text not null,
    entity_type text not null,
    entity_id uuid,
    details jsonb not null default '{}',
    created_at timestamptz not null default now()
);

create index audit_events_created_idx on public.audit_events (created_at desc);
create index audit_events_entity_idx on public.audit_events (entity_type, entity_id);

create table public.rate_limit_hits (
    key text not null check (char_length(key) between 3 and 200),
    window_start timestamptz not null,
    hits integer not null default 0,
    primary key (key, window_start)
);

-- ── RLS helpers ───────────────────────────────────────────────────────────────────────────────────

create function public.user_role() returns public.app_role
language sql stable security definer set search_path = '' as $$
    select role from public.profiles where id = auth.uid()
$$;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
    select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false)
$$;

create function public.is_editor() returns boolean
language sql stable security definer set search_path = '' as $$
    select coalesce((select role in ('editor', 'admin') from public.profiles where id = auth.uid()), false)
$$;

-- ── Row level security (reads only; writes go through the server) ─────────────────────────────────

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.clients enable row level security;
alter table public.collections enable row level security;
alter table public.articles enable row level security;
alter table public.article_revisions enable row level security;
alter table public.library_assets enable row level security;
alter table public.knowledge_media enable row level security;
alter table public.intake_questions enable row level security;
alter table public.intake_rules enable row level security;
alter table public.intakes enable row level security;
alter table public.brds enable row level security;
alter table public.api_keys enable row level security;
alter table public.audit_events enable row level security;
alter table public.rate_limit_hits enable row level security;

create policy "read own profile, editors read all" on public.profiles for select to authenticated
    using (id = auth.uid() or public.is_editor());
create policy "read products" on public.products for select to authenticated using (true);
create policy "read clients" on public.clients for select to authenticated using (true);
-- Viewers read published knowledge; editors also read drafts and archived items
create policy "read collections" on public.collections for select to authenticated
    using (status = 'published' or public.is_editor());
create policy "read articles" on public.articles for select to authenticated
    using (status = 'published' or public.is_editor());
create policy "editors read revisions" on public.article_revisions for select to authenticated
    using (public.is_editor());
create policy "read library assets" on public.library_assets for select to authenticated
    using (status = 'published' or public.is_editor());
create policy "read media" on public.knowledge_media for select to authenticated using (true);
create policy "read intake questions" on public.intake_questions for select to authenticated using (true);
create policy "editors read intake rules" on public.intake_rules for select to authenticated
    using (public.is_editor());
create policy "editors read intakes" on public.intakes for select to authenticated using (public.is_editor());
create policy "editors read BRDs" on public.brds for select to authenticated using (public.is_editor());
-- api_keys: no policies — only the server touches it
create policy "admins read audit" on public.audit_events for select to authenticated using (public.is_admin());
-- rate_limit_hits: no policies — only the server touches it

-- Belt and braces: the browser roles may only read. (RLS already denies writes without policies.)
revoke insert, update, delete, truncate on all tables in schema public from anon, authenticated;
revoke all on all tables in schema public from anon;
-- Only the server reads these (key hashes never reach a browser role, even an admin's)
revoke select on public.rate_limit_hits, public.api_keys from authenticated;

-- ── Functions (service_role only) ─────────────────────────────────────────────────────────────────

-- Counts one hit for `key` in the current fixed window and says whether it's allowed. Atomic, so
-- concurrent requests can't slip past the limit together.
create function public.hit_rate_limit(p_key text, p_window_seconds integer, p_max integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
    v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
    v_hits integer;
begin
    insert into public.rate_limit_hits (key, window_start, hits) values (p_key, v_window, 1)
    on conflict (key, window_start) do update set hits = public.rate_limit_hits.hits + 1
    returning hits into v_hits;

    delete from public.rate_limit_hits where key = p_key and window_start < v_window;

    return jsonb_build_object(
        'allowed', v_hits <= p_max,
        'remaining', greatest(p_max - v_hits, 0),
        'retryAfter', ceil(extract(epoch from (v_window + make_interval(secs => p_window_seconds) - now())))::integer
    );
end $$;

-- Saves an article and snapshots the saved version in one transaction. Returns the new version number.
-- p_expected_version guards against two editors overwriting each other (null skips the check).
create function public.save_article(
    p_article_id uuid,
    p_fields jsonb,
    p_saved_by uuid,
    p_expected_version integer
) returns integer
language plpgsql security definer set search_path = '' as $$
declare
    v_article public.articles;
    v_version integer;
begin
    select * into v_article from public.articles where id = p_article_id for update;
    if not found then raise exception 'ARTICLE_NOT_FOUND'; end if;
    if p_expected_version is not null and v_article.version <> p_expected_version then
        raise exception 'ARTICLE_CHANGED';
    end if;

    v_version := v_article.version + 1;
    update public.articles set
        title = coalesce(p_fields ->> 'title', title),
        summary = coalesce(p_fields ->> 'summary', summary),
        body = coalesce(p_fields ->> 'body', body),
        kind = coalesce((p_fields ->> 'kind')::public.article_kind, kind),
        audience = coalesce((p_fields ->> 'audience')::public.audience, audience),
        collection_id = case when p_fields ? 'collectionId' then (p_fields ->> 'collectionId')::uuid else collection_id end,
        client_id = case when p_fields ? 'clientId' then (p_fields ->> 'clientId')::uuid else client_id end,
        product_id = case when p_fields ? 'productId' then (p_fields ->> 'productId')::uuid else product_id end,
        tags = case when p_fields ? 'tags'
            then array(select jsonb_array_elements_text(p_fields -> 'tags')) else tags end,
        version = v_version,
        updated_by = p_saved_by
    where id = p_article_id
    returning * into v_article;

    insert into public.article_revisions (article_id, version, title, summary, body, saved_by)
    values (p_article_id, v_version, v_article.title, v_article.summary, v_article.body, p_saved_by);

    return v_version;
end $$;

-- Ranked full-text search over published articles and library assets. p_client_id limits results to
-- that client's knowledge plus shared knowledge (client_id null). p_include_drafts is for editors in the
-- app; agents always get published content only.
create function public.search_knowledge(
    p_query text,
    p_client_id uuid default null,
    p_product_id uuid default null,
    p_types text[] default array['article', 'asset'],
    p_include_drafts boolean default false,
    p_limit integer default 20
) returns table (
    item_type text,
    id uuid,
    title text,
    summary text,
    kind text,
    client_id uuid,
    product_id uuid,
    status public.publish_status,
    updated_at timestamptz,
    rank real,
    snippet text
)
language sql stable security definer set search_path = '' as $$
    with q as (select websearch_to_tsquery('english'::regconfig, coalesce(p_query, '')) as query)
    select * from (
        select 'article'::text, a.id, a.title, a.summary, a.kind::text, a.client_id, a.product_id, a.status,
               a.updated_at, ts_rank(a.search, q.query) as rank,
               ts_headline('english'::regconfig, a.body, q.query,
                   'MaxWords=35, MinWords=15, MaxFragments=2, StartSel=**, StopSel=**') as snippet
        from public.articles a, q
        where 'article' = any (p_types)
          and a.search @@ q.query
          and (a.status = 'published' or (p_include_drafts and a.status = 'draft'))
          and (p_client_id is null or a.client_id is null or a.client_id = p_client_id)
          and (p_product_id is null or a.product_id = p_product_id)
        union all
        select 'asset'::text, l.id, l.title, l.summary, l.kind::text, l.client_id, l.product_id, l.status,
               l.updated_at, ts_rank(l.search, q.query),
               ts_headline('english'::regconfig, l.body, q.query,
                   'MaxWords=35, MinWords=15, MaxFragments=2, StartSel=**, StopSel=**')
        from public.library_assets l, q
        where 'asset' = any (p_types)
          and l.search @@ q.query
          and (l.status = 'published' or (p_include_drafts and l.status = 'draft'))
          and (p_client_id is null or l.client_id is null or l.client_id = p_client_id)
          and (p_product_id is null or l.product_id = p_product_id)
    ) results
    order by rank desc, updated_at desc
    limit least(greatest(coalesce(p_limit, 20), 1), 50)
$$;

revoke execute on function public.hit_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke execute on function public.save_article(uuid, jsonb, uuid, integer) from public, anon, authenticated;
revoke execute on function public.search_knowledge(text, uuid, uuid, text[], boolean, integer) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, integer, integer) to service_role;
grant execute on function public.save_article(uuid, jsonb, uuid, integer) to service_role;
grant execute on function public.search_knowledge(text, uuid, uuid, text[], boolean, integer) to service_role;
