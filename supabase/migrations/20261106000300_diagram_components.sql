-- ════════════════════════════════════════════════════════════════════════════════════════════════
-- Knowledge Hub — architecture diagram component types
--
-- The palette of the architecture designer (Source system, SQL database, Cube…) becomes data that
-- editors and admins manage: name, description, colour (a key into DIAGRAM_COLORS, not a colour value),
-- an icon (a key into DIAGRAM_ICON_KEYS) and an optional image (an uploaded image or an https link).
-- Diagram nodes refer to a type by its `code` (library_assets.diagram → nodes[].kind). The code never
-- changes once created. Deleting a type is safe: nodes that use it keep their name, connections and
-- guidance and show a plain grey "Component" look until someone picks another type.
-- ════════════════════════════════════════════════════════════════════════════════════════════════

create table public.diagram_components (
    id uuid primary key default gen_random_uuid(),
    code text not null unique check (code ~ '^[a-z0-9][a-z0-9_-]{0,47}$'),
    name text not null check (char_length(btrim(name)) between 1 and 60),
    description text not null default '' check (char_length(description) <= 300),
    color text not null default 'slate' check (color in (
        'slate', 'blue', 'violet', 'teal', 'orange', 'green', 'amber', 'rose', 'indigo', 'cyan', 'fuchsia', 'lime'
    )),
    icon text not null default 'service' check (icon ~ '^[a-z_]{1,40}$'),
    image_url text not null default ''
        check (image_url = '' or image_url ~* '^https://\S+$' or image_url ~ '^/api/media/[0-9a-f-]{36}$'),
    position integer not null default 0,
    created_by uuid references public.profiles (id) on delete set null,
    updated_by uuid references public.profiles (id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index diagram_components_order_idx on public.diagram_components (position, name);

create trigger diagram_components_updated_at before update on public.diagram_components
    for each row execute function public.set_updated_at();

-- Reads: every signed-in user (reference data for the reader). Writes: only the server (service role).
alter table public.diagram_components enable row level security;
create policy "read diagram components" on public.diagram_components for select to authenticated using (true);
revoke insert, update, delete, truncate on public.diagram_components from anon, authenticated;
revoke all on public.diagram_components from anon;

-- The built-in types (same codes as the diagrams drawn so far)
insert into public.diagram_components (code, name, description, color, icon, position) values
    ('source_system', 'Source system', 'Where data comes from: ERP, CRM, HR or another line-of-business system.', 'slate', 'source', 1),
    ('database', 'SQL database', 'A SQL database, such as the Acterys database on Azure SQL.', 'blue', 'database', 2),
    ('cube', 'Cube (write-back)', 'A planning cube people write back to (budgets, forecasts).', 'violet', 'cube', 3),
    ('dimension', 'Dimension', 'A dimension table: scenarios, accounts, workflow states…', 'teal', 'dimension', 4),
    ('procedure', 'Stored procedure / trigger', 'A stored procedure or trigger that runs logic in the database.', 'orange', 'procedure', 5),
    ('fact', 'Materialized fact', 'A fact table materialized for reporting.', 'green', 'fact', 6),
    ('report', 'Reporting output', 'A report or dashboard, such as Power BI.', 'amber', 'report', 7),
    ('person', 'Person / role', 'A person or role who plans, approves or reads.', 'rose', 'person', 8),
    ('action', 'Product action', 'A product action, e.g. an Acterys copy cube or allocation.', 'indigo', 'action', 9),
    ('pipeline', 'Pipeline / integration', 'Moves data: a Fabric pipeline, Azure Data Factory, Power Automate…', 'cyan', 'pipeline', 10),
    ('service', 'Cloud service', 'A cloud service: Fabric workspace, Azure Function, Logic App…', 'fuchsia', 'service', 11),
    ('file', 'File / spreadsheet', 'A file or spreadsheet: Excel uploads, CSV drops, SharePoint lists.', 'lime', 'file', 12);
