-- ════════════════════════════════════════════════════════════════════════════════════════════════
-- Knowledge Hub — check the article tree at commit, not row by row
--
-- 20261106000100 checked each row's parent as soon as the row changed. Moving a subtree to another
-- collection changes several rows in one transaction (children and parent), so the first child failed
-- against its parent that hadn't moved yet; deleting a collection (FK on delete set null) failed the
-- same way. Now:
--   • a BEFORE trigger clears parent_id when an article has no collection (no collection = no tree);
--   • the same-collection / cycle / depth checks run in a DEFERRED constraint trigger, i.e. once the
--     whole transaction (e.g. save_article moving a subtree) is done.
-- ════════════════════════════════════════════════════════════════════════════════════════════════

drop trigger articles_check_parent on public.articles;

create function public.normalize_article_parent() returns trigger
language plpgsql set search_path = '' as $$
begin
    if new.collection_id is null then new.parent_id := null; end if;
    return new;
end $$;

create trigger articles_normalize_parent before insert or update of parent_id, collection_id on public.articles
    for each row execute function public.normalize_article_parent();

-- Same body as before, run after the row is written (the article may have been deleted since: skip it)
create or replace function public.check_article_parent() returns trigger
language plpgsql set search_path = '' as $$
declare
    v_row public.articles;
    v_parent public.articles;
    v_cursor uuid;
    v_depth integer := 0;
begin
    select * into v_row from public.articles where id = new.id;
    if not found or v_row.parent_id is null then return null; end if;
    select * into v_parent from public.articles where id = v_row.parent_id;
    if not found then raise exception 'PARENT_NOT_FOUND'; end if;
    if v_parent.collection_id is distinct from v_row.collection_id or v_row.collection_id is null then
        raise exception 'PARENT_ELSEWHERE';
    end if;
    v_cursor := v_row.parent_id;
    while v_cursor is not null loop
        if v_cursor = v_row.id then raise exception 'ARTICLE_CYCLE'; end if;
        v_depth := v_depth + 1;
        if v_depth > 5 then raise exception 'ARTICLE_TOO_DEEP'; end if;
        select parent_id into v_cursor from public.articles where id = v_cursor;
    end loop;
    return null;
end $$;

create constraint trigger articles_check_parent
    after insert or update of parent_id, collection_id on public.articles
    deferrable initially deferred
    for each row execute function public.check_article_parent();
