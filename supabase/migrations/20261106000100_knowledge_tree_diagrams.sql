-- ════════════════════════════════════════════════════════════════════════════════════════════════
-- Knowledge Hub — sub-articles, product logos, architecture diagrams, no more "flow" assets
--
--   • articles.parent_id: articles nest under other articles of the same collection (a Microsoft
--     Learn-style table of contents). Cycles and cross-collection parents are refused by a trigger;
--     moving an article to another collection moves its whole subtree.
--   • products.logo_url: a logo shown on product cards (an uploaded image or an https link).
--   • library_assets.diagram: the drag-and-drop architecture diagram (views of nodes and connections),
--     validated by the server (see @types/library/Diagram.ts).
--   • asset_kind loses 'flow' (flows are documented as reference architectures now); existing flow
--     assets become reference architectures.
-- ════════════════════════════════════════════════════════════════════════════════════════════════

-- ── Sub-articles ──────────────────────────────────────────────────────────────────────────────────

alter table public.articles
    add column parent_id uuid references public.articles (id) on delete set null,
    add constraint articles_not_own_parent check (parent_id is null or parent_id <> id);

create index articles_tree_idx on public.articles (collection_id, parent_id, position);

-- A parent must be in the same collection, and an article can't sit under its own descendant.
create function public.check_article_parent() returns trigger
language plpgsql set search_path = '' as $$
declare
    v_parent public.articles;
    v_cursor uuid;
    v_depth integer := 0;
begin
    if new.parent_id is null then return new; end if;
    select * into v_parent from public.articles where id = new.parent_id;
    if not found then raise exception 'PARENT_NOT_FOUND'; end if;
    if v_parent.collection_id is distinct from new.collection_id or new.collection_id is null then
        raise exception 'PARENT_ELSEWHERE';
    end if;
    v_cursor := new.parent_id;
    while v_cursor is not null loop
        if v_cursor = new.id then raise exception 'ARTICLE_CYCLE'; end if;
        v_depth := v_depth + 1;
        if v_depth > 5 then raise exception 'ARTICLE_TOO_DEEP'; end if;
        select parent_id into v_cursor from public.articles where id = v_cursor;
    end loop;
    return new;
end $$;

create trigger articles_check_parent before insert or update of parent_id, collection_id on public.articles
    for each row execute function public.check_article_parent();

-- The editor's save, now with the parent. Moving to another collection takes the subtree along.
create or replace function public.save_article(
    p_article_id uuid,
    p_fields jsonb,
    p_saved_by uuid,
    p_expected_version integer
) returns integer
language plpgsql security definer set search_path = '' as $$
declare
    v_article public.articles;
    v_version integer;
    v_collection uuid;
begin
    select * into v_article from public.articles where id = p_article_id for update;
    if not found then raise exception 'ARTICLE_NOT_FOUND'; end if;
    if p_expected_version is not null and v_article.version <> p_expected_version then
        raise exception 'ARTICLE_CHANGED';
    end if;

    v_collection := case when p_fields ? 'collectionId'
        then (p_fields ->> 'collectionId')::uuid else v_article.collection_id end;

    -- Children follow first (without the parent check firing against the old collection)
    if v_collection is distinct from v_article.collection_id then
        with recursive subtree as (
            select id from public.articles where parent_id = p_article_id
            union all
            select a.id from public.articles a join subtree s on a.parent_id = s.id
        )
        update public.articles set collection_id = v_collection
        where id in (select id from subtree);
        -- Without a collection there's no tree: the children become top-level
        if v_collection is null then
            update public.articles set parent_id = null where parent_id = p_article_id;
        end if;
    end if;

    v_version := v_article.version + 1;
    update public.articles set
        title = coalesce(p_fields ->> 'title', title),
        summary = coalesce(p_fields ->> 'summary', summary),
        body = coalesce(p_fields ->> 'body', body),
        kind = coalesce((p_fields ->> 'kind')::public.article_kind, kind),
        audience = coalesce((p_fields ->> 'audience')::public.audience, audience),
        collection_id = v_collection,
        parent_id = case when p_fields ? 'parentId' then (p_fields ->> 'parentId')::uuid
            when v_collection is distinct from v_article.collection_id then null else parent_id end,
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

revoke execute on function public.save_article(uuid, jsonb, uuid, integer) from public, anon, authenticated;
grant execute on function public.save_article(uuid, jsonb, uuid, integer) to service_role;

-- ── Product logos ─────────────────────────────────────────────────────────────────────────────────

alter table public.products
    add column logo_url text not null default ''
        check (logo_url = '' or logo_url ~* '^https://' or logo_url ~ '^/api/media/[0-9a-f-]{36}$');

-- ── Architecture diagrams ─────────────────────────────────────────────────────────────────────────

alter table public.library_assets
    add column diagram jsonb not null default '{}' check (jsonb_typeof(diagram) = 'object');

-- ── Asset kinds without 'flow' ────────────────────────────────────────────────────────────────────

alter type public.asset_kind rename to asset_kind_old;

create type public.asset_kind as enum ('script', 'reference_architecture', 'demo_asset', 'component', 'template');

alter table public.library_assets
    alter column kind type public.asset_kind
    using (case when kind::text = 'flow' then 'reference_architecture' else kind::text end)::public.asset_kind;

drop type public.asset_kind_old;
