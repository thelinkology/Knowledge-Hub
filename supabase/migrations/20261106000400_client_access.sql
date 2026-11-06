-- ════════════════════════════════════════════════════════════════════════════════════════════════
-- Knowledge Hub — client access for viewers and agent API keys
--
--   • Viewers belong to clients (client_members, several per person). They read shared knowledge
--     (client_id null) plus the knowledge of their own clients. They don't see the library or the client
--     pages. Editors and administrators read everything, as before.
--   • An agent API key reads shared knowledge plus the knowledge of the clients it's assigned to
--     (api_key_clients, several per key), or everything when all_clients is set.
--   • Keys can be shown again: the secret is stored encrypted (AES-256-GCM, by the server, with a key the
--     database never sees) next to its SHA-256, which is still what requests are checked against.
-- ════════════════════════════════════════════════════════════════════════════════════════════════

-- ── Viewers' clients ──────────────────────────────────────────────────────────────────────────────

create table public.client_members (
    client_id uuid not null references public.clients (id) on delete cascade,
    user_id uuid not null references public.profiles (id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (client_id, user_id)
);

create index client_members_user_idx on public.client_members (user_id);

alter table public.client_members enable row level security;
create policy "read own client memberships, editors read all" on public.client_members for select to authenticated
    using (user_id = auth.uid() or public.is_editor());
revoke insert, update, delete, truncate on public.client_members from anon, authenticated;
revoke all on public.client_members from anon;

-- Shared knowledge (no client), any client for editors and admins, otherwise only the person's clients
create function public.can_read_client(p_client_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
    select p_client_id is null
        or public.is_editor()
        or exists (
            select 1 from public.client_members m where m.client_id = p_client_id and m.user_id = auth.uid()
        )
$$;

-- ── Reads, scoped by client (writes still only go through the server) ─────────────────────────────

drop policy "read clients" on public.clients;
create policy "read clients" on public.clients for select to authenticated using (public.can_read_client(id));

drop policy "read collections" on public.collections;
create policy "read collections" on public.collections for select to authenticated
    using (public.is_editor() or (status = 'published' and public.can_read_client(client_id)));

drop policy "read articles" on public.articles;
create policy "read articles" on public.articles for select to authenticated
    using (public.is_editor() or (status = 'published' and public.can_read_client(client_id)));

-- The library is for editors and administrators
drop policy "read library assets" on public.library_assets;
create policy "editors read library assets" on public.library_assets for select to authenticated
    using (public.is_editor());

-- ── Agent API keys: several clients per key, and a key that can be shown again ────────────────────

alter table public.api_keys
    add column all_clients boolean not null default false,
    -- "v1.<iv>.<tag>.<ciphertext>" (base64url); null for keys made before keys could be shown again
    add column secret_ciphertext text check (secret_ciphertext is null or char_length(secret_ciphertext) <= 400);

create table public.api_key_clients (
    api_key_id uuid not null references public.api_keys (id) on delete cascade,
    client_id uuid not null references public.clients (id) on delete cascade,
    primary key (api_key_id, client_id)
);

create index api_key_clients_client_idx on public.api_key_clients (client_id);

-- Only the server reads keys
alter table public.api_key_clients enable row level security;
revoke all on public.api_key_clients from anon, authenticated;

-- Existing keys keep what they could read: a client key → that client; an unscoped key → every client
insert into public.api_key_clients (api_key_id, client_id)
    select id, client_id from public.api_keys where client_id is not null;
update public.api_keys set all_clients = true where client_id is null;
alter table public.api_keys drop column client_id;

-- ── Search: shared knowledge plus a list of clients ───────────────────────────────────────────────
-- p_client_ids null = every client; otherwise shared knowledge plus those clients ('{}' = shared only).

drop function public.search_knowledge(text, uuid, uuid, text[], boolean, integer);

create function public.search_knowledge(
    p_query text,
    p_client_ids uuid[] default null,
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
          and (p_client_ids is null or a.client_id is null or a.client_id = any (p_client_ids))
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
          and (p_client_ids is null or l.client_id is null or l.client_id = any (p_client_ids))
          and (p_product_id is null or l.product_id = p_product_id)
    ) results
    order by rank desc, updated_at desc
    limit least(greatest(coalesce(p_limit, 20), 1), 50)
$$;

revoke execute on function public.search_knowledge(text, uuid[], uuid, text[], boolean, integer) from public, anon, authenticated;
grant execute on function public.search_knowledge(text, uuid[], uuid, text[], boolean, integer) to service_role;
