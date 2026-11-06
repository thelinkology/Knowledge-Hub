-- ════════════════════════════════════════════════════════════════════════════════════════════════
-- Knowledge Hub — SAMPLE DATA (for demos and testing; not a migration)
--
-- How to use: run every migration first, sign up once and make yourself an administrator, then paste
-- this whole file into the Supabase SQL editor and run it. The first administrator (or else the first
-- account) becomes the author and owner of everything.
--
-- What it adds: clients, knowledge collections with articles and sub-articles for Power BI, BPP,
-- Acterys, Microsoft Fabric and Power Platform, a delivery playbook, client-specific notes, library
-- assets (scripts, reference architectures with diagrams, demo assets, components, templates), extra
-- intake questions and IF/ELSE rules, discovery intakes and BRDs, and a few custom diagram components.
--
-- Safe to run again: every row has a fixed id (5eed0000-…) or key and existing rows are left alone.
-- To remove the sample data, run the block at the end of this file (commented out).
-- Product-specific content is sample text: review it before relying on it with a client.
-- ════════════════════════════════════════════════════════════════════════════════════════════════

do $seed$
declare
    v_author uuid;
    v_acterys uuid;
    v_bpp uuid;
    v_fabric uuid;
    v_pbi uuid;
    v_pp uuid;
    -- Clients
    c_contoso constant uuid := '5eed0000-0000-4000-8000-000000010001';
    c_northwind constant uuid := '5eed0000-0000-4000-8000-000000010002';
    c_fabrikam constant uuid := '5eed0000-0000-4000-8000-000000010003';
    c_tailspin constant uuid := '5eed0000-0000-4000-8000-000000010004';
    -- Collections
    k_pbi constant uuid := '5eed0000-0000-4000-8000-000000020001';
    k_bpp constant uuid := '5eed0000-0000-4000-8000-000000020002';
    k_acterys constant uuid := '5eed0000-0000-4000-8000-000000020003';
    k_fabric constant uuid := '5eed0000-0000-4000-8000-000000020004';
    k_pp constant uuid := '5eed0000-0000-4000-8000-000000020005';
    k_playbook constant uuid := '5eed0000-0000-4000-8000-000000020006';
    k_contoso constant uuid := '5eed0000-0000-4000-8000-000000020007';
begin
    select id into v_author from public.profiles order by (role = 'admin') desc, created_at limit 1;
    select id into v_acterys from public.products where code = 'acterys';
    select id into v_bpp from public.products where code = 'bpp';
    select id into v_fabric from public.products where code = 'fabric';
    select id into v_pbi from public.products where code = 'power-bi';
    select id into v_pp from public.products where code = 'power-platform';

    -- ── Clients ───────────────────────────────────────────────────────────────────────────────────

    insert into public.clients (id, name, slug, industry, website, summary, notes, status, product_ids, owner_id, created_by) values
    (c_contoso, 'Contoso Manufacturing', 'contoso-manufacturing', 'Manufacturing', 'https://www.contoso.com',
        'Global manufacturer replacing spreadsheet budgeting with Acterys planning on Power BI, fed from Dynamics 365 Finance through Fabric.',
        $md$## Engagement
- Phase 1: GL budget and rolling forecast (Acterys)
- Phase 2: workforce planning and CapEx

## Key contacts
- **Sponsor:** CFO
- **Project lead:** FP&A manager
- **IT:** data platform team (owns the Fabric capacity)$md$,
        'active', array_remove(array[v_acterys, v_pbi, v_fabric], null), v_author, v_author),
    (c_northwind, 'Northwind Retail', 'northwind-retail', 'Retail', 'https://www.northwindtraders.com',
        'Retail chain moving store and e-commerce reporting to a Fabric lakehouse, with Power Automate approvals and a Copilot Studio agent for store managers.',
        $md$## Engagement
Fabric lakehouse (medallion), Direct Lake semantic model, store performance reports, and a Copilot Studio agent that answers "how do I" questions from the store operations manual.$md$,
        'active', array_remove(array[v_fabric, v_pbi, v_pp], null), v_author, v_author),
    (c_fabrikam, 'Fabrikam Health', 'fabrikam-health', 'Healthcare', 'https://www.fabrikam.com',
        'Hospital group evaluating Business performance planning (BPP) in Dynamics 365 Finance for departmental budgets.',
        $md$## Status
Prospect: discovery workshop booked. They already run Dynamics 365 Finance and Power BI Pro.$md$,
        'prospect', array_remove(array[v_bpp, v_pbi], null), v_author, v_author),
    (c_tailspin, 'Tailspin Logistics', 'tailspin-logistics', 'Logistics', 'https://www.tailspintoys.com',
        'Logistics company: Power Platform automation of carrier onboarding (completed project, support only).',
        '', 'inactive', array_remove(array[v_pp], null), v_author, v_author)
    on conflict do nothing;

    -- ── Collections ───────────────────────────────────────────────────────────────────────────────

    insert into public.collections (id, client_id, product_id, title, summary, status, position, created_by) values
    (k_pbi, null, v_pbi, 'Power BI essentials',
        'Semantic models, security, refresh, DAX and performance: how we build Power BI solutions.', 'published', 1, v_author),
    (k_bpp, null, v_bpp, 'Business performance planning (BPP)',
        'Planning in Dynamics 365 Finance with BPP: concepts, planning visuals, setup and gotchas.', 'published', 2, v_author),
    (k_acterys, null, v_acterys, 'Acterys planning fundamentals',
        'Modelling, write-back, templates, allocations and workflow with Acterys.', 'published', 3, v_author),
    (k_fabric, null, v_fabric, 'Microsoft Fabric foundations',
        'Lakehouses, warehouses, the medallion architecture, pipelines and capacity.', 'published', 4, v_author),
    (k_pp, null, v_pp, 'Power Platform delivery',
        'Environments, ALM, Power Automate, Copilot Studio and licensing.', 'published', 5, v_author),
    (k_playbook, null, null, 'Delivery playbook',
        'How we run discovery, write BRDs and hand over projects, whatever the product.', 'published', 6, v_author),
    (k_contoso, c_contoso, v_acterys, 'Contoso Manufacturing: project notes',
        'Environment details and decisions for the Contoso Acterys project.', 'published', 7, v_author)
    on conflict do nothing;

    -- ── Articles: Power BI ────────────────────────────────────────────────────────────────────────

    insert into public.articles (id, collection_id, parent_id, client_id, product_id, kind, audience, title, summary, body, tags, status, position, created_by, updated_by) values
    ('5eed0000-0000-4000-8000-000000030101', k_pbi, null, null, v_pbi, 'concept', 'customer',
        'Semantic model design',
        'Why the semantic model is the heart of a Power BI solution, and the design rules we follow.',
        $md$A semantic model (formerly "dataset") holds the tables, relationships, measures and security that every report reads. Reports come and go; the model is what makes numbers consistent.

## Design principles

- **One model, many reports.** Build a shared model per subject area (finance, sales) instead of one model per report.
- **Star schema first.** Fact tables for events and amounts, dimension tables for the things you filter by.
- **Measures, not calculated columns,** for anything that aggregates.
- **Name for the business.** "Net revenue", not `SUM_NET_REV`.

## Storage modes

| Mode | When to use it |
|---|---|
| Import | Most models: fastest queries, scheduled refresh |
| DirectQuery | Data must be real time or is too large to import |
| Direct Lake | Data already in a Fabric lakehouse or warehouse |

## What to agree with the client

### Ownership
Who owns the model after go-live, and who may publish reports on top of it.

### Refresh
How fresh the data must be, which drives the storage mode and the capacity.

> [!TIP]
> Draw the star schema on a whiteboard in the design workshop. It is the fastest way to find missing dimensions.

## See also
- [Star schema guidance (Microsoft Learn)](https://learn.microsoft.com/en-us/power-bi/guidance/star-schema)$md$,
        array['semantic-model', 'modeling', 'design'], 'published', 0, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000030102', k_pbi, '5eed0000-0000-4000-8000-000000030101', null, v_pbi, 'concept', 'customer',
        'Star schema basics',
        'Facts, dimensions and relationships: the shape every Power BI model should start from.',
        $md$## Facts and dimensions

**Fact tables** record events: a GL posting, a sale, a timesheet line. They hold keys and numbers and grow every day.

**Dimension tables** describe the things you analyse by: account, entity, product, date. They are wide and change slowly.

## Relationships

- One-to-many from the dimension to the fact, single direction.
- Avoid bidirectional filters unless a specific pattern needs them (and document why).
- Every model needs a proper **date table** marked as such.

## Common mistakes

### One big flat table
Exports from ERP systems are often one wide table. Split it into facts and dimensions in Power Query or, better, upstream in Fabric.

### Snowflakes
Product → Subcategory → Category as three tables. Flatten them into one Product dimension.$md$,
        array['star-schema', 'modeling'], 'published', 0, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000030103', k_pbi, '5eed0000-0000-4000-8000-000000030101', null, v_pbi, 'how_to', 'internal',
        'Set up row-level security',
        'Static and dynamic RLS roles, how to test them, and the security matrix to agree with the client.',
        $md$## Before you start
Agree a **security matrix** with the client: which roles exist and which entities, regions or cost centres each role sees. Make it a deliverable of the design milestone.

## Static roles
1. In Power BI Desktop, open **Modeling → Manage roles**.
2. Create a role per group, e.g. `Region EMEA`, with a DAX filter on the dimension: `[Region] = "EMEA"`.
3. Publish, then add Entra ID security groups to each role in the service.

## Dynamic roles
Use a mapping table (user email → entity) related to the dimension, and one role filtering it:

```
[UserEmail] = USERPRINCIPALNAME()
```

## Test it
- **View as** in Desktop and in the service, for each role.
- Test a user in two groups: roles are additive.

> [!WARNING]
> Workspace admins, members and contributors bypass RLS. Report consumers must be viewers (or use an app).

## See also
- [Row-level security (Microsoft Learn)](https://learn.microsoft.com/en-us/power-bi/enterprise/service-admin-rls)$md$,
        array['rls', 'security'], 'published', 1, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000030104', k_pbi, null, null, v_pbi, 'how_to', 'customer',
        'Configure incremental refresh',
        'Refresh only recent data in large models: parameters, the policy, and what to check after publishing.',
        $md$Incremental refresh keeps history in partitions and refreshes only the latest periods, so large models refresh in minutes instead of hours.

## Steps
1. In Power Query, create two **DateTime** parameters: `RangeStart` and `RangeEnd`.
2. Filter the fact table's date column: `>= RangeStart` and `< RangeEnd`.
3. Right-click the table → **Incremental refresh**: e.g. store 5 years, refresh the last 10 days.
4. Publish. The first refresh in the service builds every partition and takes longest.

## Check
- The filter must **fold** to the source (View Native Query). If it doesn't, every refresh reads everything.
- Use **Detect data changes** only with a reliable last-modified column.

## When not to use it
Small models (under a few million rows), or sources where old periods are restated often.

## See also
- [Incremental refresh overview (Microsoft Learn)](https://learn.microsoft.com/en-us/power-bi/connect-data/incremental-refresh-overview)$md$,
        array['refresh', 'performance'], 'published', 1, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000030105', k_pbi, null, null, v_pbi, 'reference', 'internal',
        'DAX patterns we reuse',
        'Copy-ready measures for time intelligence, budget vs actual and safe division.',
        $md$## Time intelligence

```
Revenue YTD = TOTALYTD ( [Revenue], 'Date'[Date] )
Revenue PY = CALCULATE ( [Revenue], SAMEPERIODLASTYEAR ( 'Date'[Date] ) )
Revenue YoY % = DIVIDE ( [Revenue] - [Revenue PY], [Revenue PY] )
```

## Budget vs actual

```
Variance = [Actual] - [Budget]
Variance % = DIVIDE ( [Variance], ABS ( [Budget] ) )
```

Show favourable variances in green using a measure for the colour rather than conditional formatting rules per visual.

## Conventions
- Prefix hidden helper measures with `_`.
- Use `DIVIDE` instead of `/`.
- Put measures in a dedicated, empty "Measures" table.

The library has the full set: see **Time intelligence DAX measures**.$md$,
        array['dax', 'measures'], 'published', 2, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000030106', k_pbi, null, null, v_pbi, 'troubleshooting', 'internal',
        'Troubleshoot slow reports',
        'Find out whether the model, the DAX or the visuals are slow, and the usual fixes.',
        $md$## Measure first
Open **Performance analyzer** in Desktop, refresh the visuals, and sort by duration. Each visual shows DAX query time, visual display time and "Other".

## If the DAX query is slow
- Copy the query into DAX Studio and look at the storage engine vs formula engine time.
- Replace `FILTER ( ALL ( table ) … )` over large tables with column filters.
- Avoid row-by-row iterators (`SUMX`) over the fact table when a plain `SUM` would do.

## If the model is large
- Remove unused columns, especially high-cardinality text and datetime columns.
- Split datetime into date and time.
- Use **VertiPaq Analyzer** to see which columns use the memory.

## If there are too many visuals
More than ~15 visuals on a page means more than 15 queries. Use bookmarks or drill-through pages.$md$,
        array['performance', 'troubleshooting'], 'published', 3, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000030107', k_pbi, null, null, v_pbi, 'best_practice', 'internal',
        'Deployment pipelines and ALM',
        'Dev, test and production workspaces with deployment pipelines and Git integration (work in progress).',
        $md$## Workspaces
One workspace per stage: **Dev**, **Test**, **Prod**. Only the pipeline deploys to Test and Prod.

## Parameters and rules
Use deployment rules to switch data source parameters per stage.

## Still to write
- Git integration with Azure DevOps
- Who approves deployments to production$md$,
        array['alm', 'deployment'], 'draft', 4, v_author, v_author)
    on conflict do nothing;

    -- ── Articles: BPP ─────────────────────────────────────────────────────────────────────────────

    insert into public.articles (id, collection_id, parent_id, client_id, product_id, kind, audience, title, summary, body, tags, status, position, created_by, updated_by) values
    ('5eed0000-0000-4000-8000-000000030201', k_bpp, null, null, v_bpp, 'concept', 'customer',
        'Business performance planning overview',
        'What BPP is, how it uses Dataverse and Power BI, and the planning scenarios it covers.',
        $md$Business performance planning (BPP) is the planning solution for Dynamics 365 Finance. Planners work in **Power BI** with planning visuals that write back to **Dataverse**.

## Key capabilities
- Budgets, forecasts and what-if scenarios at any level of detail
- Top-down and bottom-up planning with allocations
- Driver-based calculations
- Comments and collaboration on plan values

## How it fits together

| Layer | What it does |
|---|---|
| Dynamics 365 Finance | Actuals and master data |
| Dataverse | Cubes, dimensions and plan data |
| Power BI | Planning visuals and reports |

## Typical scenarios
### Financial planning
Departmental budgets on the general ledger.

### Operational planning
Sales, headcount or production volumes that feed the financial plan.

## See also
- [Business performance planning overview (Microsoft Learn)](https://learn.microsoft.com/en-us/dynamics365/finance/business-performance-planning/business-performance-planning-overview)$md$,
        array['bpp', 'planning', 'dataverse'], 'published', 0, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000030202', k_bpp, '5eed0000-0000-4000-8000-000000030201', null, v_bpp, 'concept', 'customer',
        'Matrix planning visual',
        'The default planning visual: enter, adjust and allocate values in a pivot-style grid that writes back to Dataverse.',
        $md$The Matrix planning visual is the default planning visual in BPP. Users enter, adjust and allocate data directly in Power BI reports, with write-back to Dataverse tables.

## Key capabilities
- Top-down and bottom-up planning at any level of the hierarchy
- Allocation of totals to lower levels (even, proportional to a reference)
- Comments on cells

## Build a Matrix planning visual
1. Add the visual to a report page connected to the planning cube.
2. Put dimensions on rows and columns (for example Account by Month).
3. Add the plan measure and choose which scenarios are editable.

## Granularity and write-back
Values are written at the granularity of the cube. Entering a value at a higher level allocates it down.

## Best practices
- Keep editable grids small: one cost centre or one account group per page.
- Lock actual periods so only future periods are editable.$md$,
        array['bpp', 'visuals', 'write-back'], 'published', 0, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000030203', k_bpp, '5eed0000-0000-4000-8000-000000030201', null, v_bpp, 'concept', 'customer',
        'Table edit visual',
        'A row-based visual for editing plan lines and attributes, such as headcount or project lists.',
        $md$## When to use it
Use Table edit when planners work with **lists** rather than grids: positions in a headcount plan, projects in a CapEx plan, or price lists.

## How it works
Each row is a record in the cube; columns are attributes or values. Users can add rows, edit values and delete rows they own.

## Tips
- Show only the columns planners need to change; put the rest in a tooltip.
- Combine with a Matrix planning visual on the same page to see the effect on totals.$md$,
        array['bpp', 'visuals'], 'published', 1, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000030204', k_bpp, null, null, v_bpp, 'how_to', 'internal',
        'Set up a planning cycle',
        'Create the cube, load actuals, open the planning scenario and share the planning report.',
        $md$## Prerequisites
- Dynamics 365 Finance with BPP enabled, and a Dataverse environment linked to it
- Power BI Pro (or Premium per user) licences for planners

## Steps
### 1. Define the cube
Choose the dimensions (account, department, period, scenario) and the measures.

### 2. Load actuals
Bring the last 12–24 months of actuals into the cube as the reference for the plan.

### 3. Create the plan scenario
Copy actuals or the previous forecast as a starting point.

### 4. Publish the planning report
Share the Power BI report with the planners' security group, with the Matrix planning visual on the input pages.

## After go-live
Agree a calendar: when the scenario opens, review dates and when it locks.$md$,
        array['bpp', 'setup'], 'published', 1, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000030205', k_bpp, '5eed0000-0000-4000-8000-000000030204', null, v_bpp, 'how_to', 'internal',
        'Configure drivers and allocations',
        'Driver-based calculations (rates × volumes) and allocation rules in BPP.',
        $md$## Drivers
A driver is an input that other values depend on, such as salary per FTE or price per unit. Planners enter the driver; the plan value is calculated.

### Driver configuration options
- Calculated at the cube granularity
- Can depend on another driver (multi-driver dependency): keep chains short and documented

## Allocations
- **Even:** spread a total equally across children
- **Proportional:** spread by a reference (last year's actuals)

## Test
Enter a value at a parent level and check the children; then change the driver and check the totals.$md$,
        array['bpp', 'drivers', 'allocation'], 'published', 0, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000030206', k_bpp, null, null, v_bpp, 'best_practice', 'internal',
        'BPP implementation gotchas',
        'What has bitten us on BPP projects: environments, licences, granularity and data volumes.',
        $md$## Environments
BPP needs a **Dataverse environment** linked to Finance. Check this in the first week: provisioning can take longer than expected.

## Licences
Every planner who writes back needs a Power BI licence; check the count against the planner list.

## Granularity
Planning at transaction level (daily, per item) makes cubes huge. Plan at month × account × department and allocate if needed.

## Change management
Planners used to Excel need training on the visuals. Budget a session per planner group, and a sandbox to practise in.$md$,
        array['bpp', 'gotchas'], 'published', 2, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000030207', k_bpp, null, null, v_bpp, 'troubleshooting', 'internal',
        'Troubleshoot write-back errors',
        'Values not saving from the planning visuals: permissions, locked periods and cube refresh.',
        $md$## The value reverts after entering it
- The period or scenario is **locked**: check the scenario status.
- The user has no **write** permission on the cube in Dataverse: check their security role.

## "Something went wrong" in the visual
- The report is connected to an old version of the cube: refresh the semantic model.
- The Dataverse environment is in admin mode or being updated.

## Totals don't match after allocation
Rounding: allocations at cent level can leave a remainder on the last child. Agree the rounding rule with Finance.$md$,
        array['bpp', 'write-back', 'troubleshooting'], 'published', 3, v_author, v_author)
    on conflict do nothing;

    -- ── Articles: Acterys ─────────────────────────────────────────────────────────────────────────

    insert into public.articles (id, collection_id, parent_id, client_id, product_id, kind, audience, title, summary, body, tags, status, position, created_by, updated_by) values
    ('5eed0000-0000-4000-8000-000000030301', k_acterys, null, null, v_acterys, 'concept', 'customer',
        'Acterys platform overview',
        'Planning, budgeting, forecasting and consolidation on Power BI with write-back to a SQL database.',
        $md$Acterys adds planning to the Microsoft stack: models live in a **SQL database** (usually Azure SQL), planners enter data from **Power BI** or **Excel**, and reports show plan and actuals together.

## Building blocks
- **Model Manager:** dimensions, hierarchies and cubes
- **Write-back:** planning input from Power BI visuals and the Excel add-in
- **Workflow:** submission and approval of plans
- **Connectors:** load actuals from ERP and other sources

## Why clients choose it
### Familiar tools
Planners stay in Power BI and Excel.

### One version of the truth
Plan and actual data in one database, reported with one semantic model.

## Typical first project
GL budget and forecast, then workforce or CapEx planning in a second phase.$md$,
        array['acterys', 'planning'], 'published', 0, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000030302', k_acterys, '5eed0000-0000-4000-8000-000000030301', null, v_acterys, 'concept', 'internal',
        'Model Manager: dimensions and cubes',
        'How we design Acterys dimensions, hierarchies and cubes for a GL planning model.',
        $md$## Dimensions
Start from the client's chart of accounts and entity structure:
- **Account** with the P&L and balance sheet hierarchies
- **Entity** / department
- **Time** (month grain) and **Scenario** (Actual, Budget, Forecast)

## Cubes
A cube is the intersection of dimensions that holds values. Keep a separate cube for drivers (rates, FTE) if they have a different grain.

## Naming
Use the client's codes as keys and their names as captions, so reconciliations with the ERP are straightforward.

## Gotchas
### Changing hierarchies
Plan for hierarchy changes during the year: version them or agree a freeze date.$md$,
        array['acterys', 'modeling'], 'published', 0, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000030303', k_acterys, '5eed0000-0000-4000-8000-000000030301', null, v_acterys, 'concept', 'customer',
        'Write-back from Power BI and Excel',
        'How planners enter and change numbers, and where the values are stored.',
        $md$## In Power BI
Planners type into an input grid on a report page. Values are written to the planning cube in the SQL database and the report refreshes.

## In Excel
The Excel add-in connects to the same model, so planners who prefer spreadsheets can work in Excel with the same security.

## Security
Write access is set per dimension member, e.g. a department manager writes to their own department only.

## Audit
Every change is stored with the user and time, so you can see who changed a number.$md$,
        array['acterys', 'write-back'], 'published', 1, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000030304', k_acterys, null, null, v_acterys, 'tutorial', 'internal',
        'Build a budget input template',
        'Step by step: a Power BI page where department managers enter next year''s budget.',
        $md$## What you'll build
An input page filtered to the manager's department, with accounts on rows and months on columns, last year's actuals for reference, and a total check.

## Steps
### 1. Prepare the model
Make sure the Budget scenario is writable and Actuals is read-only.

### 2. Add the input grid
Rows: Account (P&L hierarchy). Columns: Month. Values: Budget.

### 3. Add the reference
Add a second, read-only grid with last year's actuals beside it.

### 4. Filter by user
Use the security setup so each manager only sees their department.

### 5. Test with a planner
Sign in as a test planner and enter values; check them in the database.

> [!TIP]
> Spread annual values by last year's seasonality to save planners time.$md$,
        array['acterys', 'template', 'budget'], 'published', 1, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000030305', k_acterys, null, null, v_acterys, 'how_to', 'internal',
        'Copy cube and allocations',
        'Seed a forecast from actuals and budget, and allocate central costs to departments.',
        $md$## Copy cube
Use a copy action to seed the forecast: actuals for closed months, budget for open months. Run it at the start of each forecast cycle.

## Allocations
Typical rules:
- IT and facilities costs by headcount
- Marketing by revenue

Implement allocations as a stored procedure (see the library script **Acterys allocation stored procedure**) and run it after planners submit.

## Check
Allocated totals must equal the source totals; add a reconciliation report page.$md$,
        array['acterys', 'allocation', 'forecast'], 'published', 2, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000030306', k_acterys, null, null, v_acterys, 'how_to', 'internal',
        'Approval workflow',
        'Submit, review and approve plans by department, and lock them once approved.',
        $md$## States
Draft → Submitted → Approved (or Rejected back to Draft).

## Setup
1. Add a workflow dimension (one member per department) with a status.
2. Give planners the right to submit and controllers the right to approve.
3. Lock input when the status is Submitted or Approved.

## Notifications
Use a Power Automate flow to email the approver when a department submits.

## Reporting
A status page shows which departments are still in draft.$md$,
        array['acterys', 'workflow', 'approval'], 'published', 3, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000030307', k_acterys, null, null, v_acterys, 'best_practice', 'internal',
        'Acterys delivery best practices',
        'Lessons from Acterys projects: scope, data, licences and testing.',
        $md$## Scope
Start with one process (usually the GL budget) and get it live before adding workforce or CapEx.

## Data
- Load and reconcile actuals **before** building input templates.
- Agree the chart of accounts mapping in writing.

## Licences
Check the number of contributors against the licence count early.

## Testing
Run a "mock budget" with two or three real planners before the real cycle opens.$md$,
        array['acterys', 'best-practice'], 'published', 4, v_author, v_author)
    on conflict do nothing;

    -- ── Articles: Microsoft Fabric ────────────────────────────────────────────────────────────────

    insert into public.articles (id, collection_id, parent_id, client_id, product_id, kind, audience, title, summary, body, tags, status, position, created_by, updated_by) values
    ('5eed0000-0000-4000-8000-000000030401', k_fabric, null, null, v_fabric, 'concept', 'customer',
        'Lakehouse or warehouse?',
        'Both store data in OneLake. Choose by the skills of the team and the kind of workloads.',
        $md$## Lakehouse
Files and Delta tables, worked on with **Spark notebooks** and pipelines. Best for data engineers, semi-structured data and data science.

## Warehouse
Delta tables with full **T-SQL** (insert, update, stored procedures). Best for SQL developers and classic dimensional models.

## Comparison

| | Lakehouse | Warehouse |
|---|---|---|
| Main language | PySpark / Spark SQL | T-SQL |
| Write with SQL | Read-only SQL endpoint | Yes |
| Unstructured files | Yes | No |

## Our default
Bronze and silver in a lakehouse, gold in a warehouse or lakehouse depending on the team's skills. Both work with Direct Lake semantic models.$md$,
        array['fabric', 'lakehouse', 'warehouse'], 'published', 0, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000030402', k_fabric, null, null, v_fabric, 'best_practice', 'customer',
        'Medallion architecture in Fabric',
        'Bronze, silver and gold layers: what goes in each and why it pays off.',
        $md$The medallion architecture organises data in three layers, each cleaner than the last.

## The layers

| Layer | Contains | Who uses it |
|---|---|---|
| Bronze | Raw copies of the source | Data engineers |
| Silver | Cleaned, typed, de-duplicated | Data engineers, analysts |
| Gold | Business-ready facts and dimensions | Semantic models and reports |

## Why it helps
- You can rebuild silver and gold from bronze without going back to the source.
- Each layer has one job, so problems are easier to find.

## Workspaces
Use separate lakehouses (or workspaces) per layer so permissions can differ.

## See also
- [Medallion lakehouse architecture (Microsoft Learn)](https://learn.microsoft.com/en-us/fabric/onelake/onelake-medallion-lakehouse-architecture)$md$,
        array['fabric', 'medallion', 'architecture'], 'published', 1, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000030403', k_fabric, '5eed0000-0000-4000-8000-000000030402', null, v_fabric, 'how_to', 'internal',
        'Bronze: land raw data',
        'Copy source data as-is into the bronze lakehouse, with load metadata.',
        $md$## Rules
- Keep the source shape: no renaming, no filtering.
- Add load columns: `_load_date`, `_source_file`.
- Use pipelines (Copy activity) for databases and APIs; shortcuts for data already in ADLS or S3.

## Folder layout
`Files/<source>/<entity>/<yyyy>/<mm>/<dd>/` for files, then load to Delta tables `bronze_<source>_<entity>`.

## Incremental loads
Use a watermark (last modified date) stored in a control table.$md$,
        array['fabric', 'bronze', 'ingestion'], 'published', 0, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000030404', k_fabric, '5eed0000-0000-4000-8000-000000030402', null, v_fabric, 'how_to', 'internal',
        'Silver and gold: clean and model',
        'Type, clean and de-duplicate in silver; build facts and dimensions in gold.',
        $md$## Silver
- Cast types, trim text, standardise codes.
- De-duplicate with the business key and the latest `_load_date`.
- Use `MERGE` into Delta tables for upserts.

## Gold
- Star schema: `dim_` and `fact_` tables.
- Surrogate keys for dimensions that change over time.
- Only what reports need: gold is the contract with the semantic model.

## Tools
Notebooks for complex logic, Dataflows Gen2 for simple shaping, and warehouse stored procedures if the team prefers SQL. The library has a notebook sample: **Fabric notebook: bronze to silver**.$md$,
        array['fabric', 'silver', 'gold', 'modeling'], 'published', 1, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000030405', k_fabric, null, null, v_fabric, 'tutorial', 'internal',
        'Ingest ERP data with a pipeline',
        'Build a Fabric pipeline that copies GL data from an Azure SQL ERP replica into bronze every night.',
        $md$## What you'll build
A pipeline with a Copy activity from Azure SQL to the bronze lakehouse, a watermark for incremental loads, and a nightly schedule.

## Steps
### 1. Create the connection
In the workspace, create a connection to the source database with a service account.

### 2. Add the Copy activity
Source: a query filtered by the watermark. Destination: the bronze lakehouse table.

### 3. Update the watermark
After the copy, a Script activity stores the new maximum modified date in the control table.

### 4. Schedule
Run nightly after the ERP close jobs; add a failure notification (Teams or email).

> [!NOTE]
> On-premises sources need an on-premises data gateway.$md$,
        array['fabric', 'pipeline', 'tutorial'], 'published', 2, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000030406', k_fabric, null, null, v_fabric, 'reference', 'customer',
        'Capacity and licensing',
        'Fabric capacities (F SKUs), what they include, and the Power BI licences readers still need.',
        $md$## Capacities
Fabric runs on a capacity (F2, F4 … F2048). Every workload in the workspace (pipelines, notebooks, warehouses, reports) uses capacity units.

## Sizing
- Start small for development; scale up or down at any time.
- Pause the capacity outside working hours in development to save cost.

## Report readers
Below **F64**, people who read reports need a Power BI Pro (or PPU) licence. From F64, viewers with a free licence can read content in that capacity.

## Monitoring
Install the **Fabric Capacity Metrics** app to see which items use the capacity.$md$,
        array['fabric', 'licensing', 'capacity'], 'published', 3, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000030407', k_fabric, null, null, v_fabric, 'troubleshooting', 'internal',
        'Troubleshoot pipeline and refresh failures',
        'Gateway, credentials, throttling and schema drift: the usual causes and fixes.',
        $md$## Credentials expired
Connections using personal accounts break when passwords change. Use a service account or service principal.

## Gateway offline
Check the gateway server is running and on the latest version.

## Throttling
If the capacity is overloaded, jobs are delayed or rejected. Check the Capacity Metrics app and spread schedules.

## Schema drift
A new or renamed column in the source breaks the Copy activity mapping. Land bronze with schema drift allowed, and validate in silver.$md$,
        array['fabric', 'pipeline', 'troubleshooting'], 'published', 4, v_author, v_author)
    on conflict do nothing;

    -- ── Articles: Power Platform ──────────────────────────────────────────────────────────────────

    insert into public.articles (id, collection_id, parent_id, client_id, product_id, kind, audience, title, summary, body, tags, status, position, created_by, updated_by) values
    ('5eed0000-0000-4000-8000-000000030501', k_pp, null, null, v_pp, 'best_practice', 'customer',
        'Environment strategy',
        'Separate development, test and production environments, and keep the default environment for personal productivity.',
        $md$## Recommended environments

| Environment | Purpose |
|---|---|
| Default | Personal productivity only |
| Dev | Makers build solutions |
| Test | Users test managed solutions |
| Prod | Live solutions, changes only through deployment |

## Rules
- Business-critical apps and flows never live in the default environment.
- Production uses **managed solutions**.
- Service accounts own production connections.

## See also
- [Environments overview (Microsoft Learn)](https://learn.microsoft.com/en-us/power-platform/admin/environments-overview)$md$,
        array['power-platform', 'environments', 'governance'], 'published', 0, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000030502', k_pp, '5eed0000-0000-4000-8000-000000030501', null, v_pp, 'how_to', 'internal',
        'Solutions and ALM',
        'Build in an unmanaged solution, deploy managed solutions with pipelines.',
        $md$## In development
- Create a solution with your own publisher prefix before building anything.
- Use **environment variables** for URLs and IDs, and **connection references** for connections.

## Deploying
Use Power Platform pipelines (or Azure DevOps / GitHub Actions with the Power Platform Build Tools) to export a managed solution and import it into Test and Prod.

## Source control
Unpack solutions into the repository so changes can be reviewed.$md$,
        array['power-platform', 'alm', 'solutions'], 'published', 0, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000030503', k_pp, '5eed0000-0000-4000-8000-000000030501', null, v_pp, 'reference', 'internal',
        'Data loss prevention policies',
        'How DLP policies group connectors, and what to ask the client''s admin before building.',
        $md$## Connector groups
- **Business:** connectors that may share data with each other
- **Non-business:** personal-use connectors
- **Blocked:** cannot be used

A flow cannot combine business and non-business connectors.

## Before building
Ask the tenant admin for the DLP policies on the target environment. A flow that works in dev can fail in production because of a stricter policy.$md$,
        array['power-platform', 'dlp', 'governance'], 'published', 1, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000030504', k_pp, null, null, v_pp, 'tutorial', 'internal',
        'Build an approval flow',
        'A Power Automate flow that routes a request to an approver in Teams and records the decision.',
        $md$## What you'll build
When a request is added to a SharePoint list (or Dataverse table), the approver gets an approval in Teams; the outcome is written back to the request.

## Steps
### 1. Trigger
"When an item is created" on the requests list.

### 2. Start the approval
"Start and wait for an approval", type **Approve/Reject – First to respond**, assigned to the approver from the item.

### 3. Record the outcome
Update the item with the outcome, the approver's comments and the date.

### 4. Notify
Post the outcome to the requester in Teams.

## Production checklist
- Owned by a service account, inside a solution
- Connection references, not personal connections
- Error handling with a "Configure run after" scope$md$,
        array['power-automate', 'approvals', 'tutorial'], 'published', 1, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000030505', k_pp, null, null, v_pp, 'how_to', 'internal',
        'Connect a Copilot Studio agent to Knowledge Hub',
        'Give an agent our published knowledge through the Knowledge Hub API.',
        $md$## Create an API key
In Knowledge Hub: **Administration → Copilot integration → Create key**. Scope it to a client if the agent is for one client. Copy it: it is shown once.

## Add the tool in Copilot Studio
1. Open the agent → **Tools → Add a tool → New tool → REST API**.
2. Import `https://<knowledge-hub>/api/v1/openapi.json`.
3. Authentication: API key, header `x-api-key`.

## Instructions for the agent
"Use SearchKnowledge to find relevant articles, then GetArticle for the full content. Cite the article URL. If nothing relevant is found, say so."

## Test
Ask a question answered by a published article and check that the agent cites it.$md$,
        array['copilot-studio', 'agent', 'integration'], 'published', 2, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000030506', k_pp, null, null, v_pp, 'reference', 'internal',
        'Licensing quick reference',
        'Which licences makers, users and flows need: standard vs premium connectors, Copilot Studio messages.',
        $md$## Standard vs premium
Flows and apps using only **standard** connectors (SharePoint, Outlook, Teams) are covered by Microsoft 365 licences. **Premium** connectors (Dataverse, SQL, HTTP, custom connectors) need Power Apps / Power Automate premium licences.

## Unattended automation
Flows that run without a user (scheduled, service account) may need a per-flow (process) licence.

## Copilot Studio
Agents consume messages from a capacity pack or pay-as-you-go billing.

> [!WARNING]
> Licensing changes often. Always confirm with the client's licensing partner before quoting.$md$,
        array['power-platform', 'licensing'], 'published', 3, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000030507', k_pp, null, null, v_pp, 'troubleshooting', 'internal',
        'Troubleshoot failing flows',
        'Read the run history, fix connection and throttling problems, and add error handling.',
        $md$## Read the run history
Open the failed run and expand the red action: the error message and the inputs and outputs are there.

## Common causes
### Connection broken
The connection owner left or changed their password. Use connection references owned by a service account.

### Throttling (429)
Too many calls to a connector. Add delays, batch updates, or spread the load.

### Data problems
Empty values in required fields. Validate inputs early with a Condition.

## Error handling
Wrap the main steps in a Scope and add a second Scope that runs only if the first fails, to notify the support mailbox.$md$,
        array['power-automate', 'troubleshooting'], 'published', 4, v_author, v_author)
    on conflict do nothing;

    -- ── Articles: delivery playbook, client notes, and one article outside any collection ─────────

    insert into public.articles (id, collection_id, parent_id, client_id, product_id, kind, audience, title, summary, body, tags, status, position, created_by, updated_by) values
    ('5eed0000-0000-4000-8000-000000030601', k_playbook, null, null, null, 'how_to', 'internal',
        'Run a discovery workshop',
        'Agenda, who to invite and what to capture so the intake and BRD write themselves.',
        $md$## Before the workshop
- Send the agenda and the list of questions from the **Requirements** intake.
- Ask for sample reports, the chart of accounts and a data extract.

## Agenda (half a day)
1. Business goals and success criteria (30 min)
2. Current process walkthrough (60 min)
3. Data sources and volumes (45 min)
4. Security and users (30 min)
5. Timeline, constraints and next steps (30 min)

## Capture
Fill in the intake during the workshop; the IF/ELSE rules flag gotchas while you talk.

## After
Send a summary within two days and generate the BRDs from the intake.$md$,
        array['discovery', 'workshop', 'playbook'], 'published', 0, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000030602', k_playbook, null, null, null, 'best_practice', 'internal',
        'Write a BRD the client signs',
        'Keep the customer BRD short, concrete and free of internal notes; put delivery detail in the internal brief.',
        $md$## Customer BRD
- Their goals in their words
- Scope and what is out of scope
- The reference architecture and a link to the demo
- Milestones with deliverables and dependencies on their side

## Internal delivery brief
- Gotchas from the intake rules
- Links to scripts, components and learning material
- Risks and assumptions

## Tips
### Name dependencies
"Client provides ERP extract by week 2" gets done; "data access" doesn't.

### Version it
Generate a fresh draft after each workshop; mark the signed version as final.$md$,
        array['brd', 'playbook'], 'published', 1, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000030603', k_playbook, null, null, null, 'reference', 'internal',
        'Project handover checklist',
        'Everything the client and our support team need at go-live.',
        $md$## Documentation
- [ ] Solution overview and architecture diagram
- [ ] Admin guide (refresh schedules, security, licences)
- [ ] User guide or training recording

## Access
- [ ] Service accounts and their owners documented
- [ ] Our access reduced to support level

## Operations
- [ ] Monitoring and failure alerts go to the client's mailbox
- [ ] Support contacts and SLA agreed

## Sign-off
- [ ] UAT signed
- [ ] Final BRD marked as final$md$,
        array['handover', 'checklist', 'playbook'], 'published', 2, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000030701', k_contoso, null, c_contoso, v_acterys, 'reference', 'internal',
        'Contoso environment details',
        'Tenants, workspaces, databases and service accounts for the Contoso project.',
        $md$## Environments

| | Dev | Prod |
|---|---|---|
| Power BI workspace | Contoso Planning [Dev] | Contoso Planning |
| Acterys database | acterys-contoso-dev | acterys-contoso-prod |
| Fabric workspace | Contoso Finance Data [Dev] | Contoso Finance Data |

## Service accounts
- `svc-planning@contoso.com`: owns refreshes and pipelines

## Access requests
Raised through the Contoso IT portal; allow five working days.$md$,
        array['contoso', 'environments'], 'published', 0, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000030702', k_contoso, null, c_contoso, v_acterys, 'reference', 'internal',
        'Contoso decisions log',
        'Design decisions agreed with Contoso, with dates and who agreed them.',
        $md$## Decisions

| Date | Decision | Agreed by |
|---|---|---|
| Week 1 | Plan at month × account × cost centre | FP&A manager |
| Week 2 | Forecast seeded from actuals + budget (copy cube) | FP&A manager |
| Week 3 | Load actuals with a Fabric pipeline from D365 Finance | Data platform lead |

## Open questions
- Do intercompany accounts need eliminations in phase 1?$md$,
        array['contoso', 'decisions'], 'published', 1, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000030801', null, null, null, null, 'reference', 'customer',
        'Glossary of planning terms',
        'Budget, forecast, scenario, driver, allocation, write-back: the words we use in planning projects.',
        $md$## Terms

### Budget
The approved plan for the coming year, usually set once.

### Forecast
An updated estimate of the year's outcome, refreshed monthly or quarterly.

### Scenario
A version of the numbers: Actual, Budget, Forecast, or a what-if.

### Driver
An input other values are calculated from, such as price × volume.

### Allocation
Spreading a total across members (departments, months) by a rule.

### Write-back
Entering numbers in a report and saving them to the database.$md$,
        array['glossary', 'planning'], 'published', 0, v_author, v_author)
    on conflict do nothing;

    update public.articles set published_at = updated_at
    where id::text like '5eed0000-%' and status = 'published' and published_at is null;

    -- Version 1 in the revision history, as the app does when it creates an article
    insert into public.article_revisions (article_id, version, title, summary, body, saved_by)
    select id, version, title, summary, body, v_author from public.articles where id::text like '5eed0000-%'
    on conflict (article_id, version) do nothing;

    -- ── Diagram component types (custom, next to the built-in ones) ───────────────────────────────

    insert into public.diagram_components (code, name, description, color, icon, position, created_by, updated_by) values
    ('dataverse', 'Dataverse', 'Dataverse tables (BPP cubes, Power Apps data).', 'teal', 'table', 20, v_author, v_author),
    ('fabric_lakehouse', 'Fabric lakehouse', 'A lakehouse layer in OneLake (bronze, silver or gold).', 'cyan', 'folder', 21, v_author, v_author),
    ('semantic_model', 'Semantic model', 'A Power BI semantic model (import, DirectQuery or Direct Lake).', 'amber', 'chart', 22, v_author, v_author),
    ('power_app', 'Power App', 'A canvas or model-driven app.', 'fuchsia', 'app', 23, v_author, v_author),
    ('copilot_agent', 'Copilot Studio agent', 'An agent built in Copilot Studio.', 'indigo', 'bot', 24, v_author, v_author),
    ('teams_channel', 'Teams / email', 'Notifications and approvals in Microsoft Teams or Outlook.', 'violet', 'email', 25, v_author, v_author)
    on conflict (code) do nothing;

    -- ── Library assets ────────────────────────────────────────────────────────────────────────────

    insert into public.library_assets (id, client_id, product_id, kind, title, summary, body, url, code, code_language, tags, status, created_by, updated_by) values
    ('5eed0000-0000-4000-8000-000000040001', null, v_pbi, 'script', 'Time intelligence DAX measures',
        'YTD, prior year, year-over-year and rolling 12 months measures for any model with a marked date table.',
        $md$## How to use
1. Make sure the model has a date table marked as such, related to the fact table.
2. Replace `[Revenue]` with your base measure.
3. Paste the measures into the Measures table (DAX query view → define and add).

## Notes
Rolling 12 months returns blank until 12 months of data exist.$md$,
        '', $code$Revenue YTD =
TOTALYTD ( [Revenue], 'Date'[Date] )

Revenue PY =
CALCULATE ( [Revenue], SAMEPERIODLASTYEAR ( 'Date'[Date] ) )

Revenue YoY % =
DIVIDE ( [Revenue] - [Revenue PY], [Revenue PY] )

Revenue R12M =
CALCULATE (
    [Revenue],
    DATESINPERIOD ( 'Date'[Date], MAX ( 'Date'[Date] ), -12, MONTH )
)$code$, 'dax', array['dax', 'time-intelligence'], 'published', v_author, v_author),
    ('5eed0000-0000-4000-8000-000000040002', null, v_pbi, 'script', 'Create workspaces with PowerShell',
        'Create Dev/Test/Prod workspaces and grant a security group access, with the Power BI management module.',
        $md$## Requirements
- `Install-Module MicrosoftPowerBIMgmt`
- A Power BI administrator or a service principal allowed to use the admin APIs

## How to use
Set the client name and the group object id, then run. The script skips workspaces that already exist.$md$,
        '', $code$$client = 'Contoso'
$groupId = '00000000-0000-0000-0000-000000000000'

Connect-PowerBIServiceAccount

foreach ($stage in @('Dev', 'Test', 'Prod')) {
    $name = if ($stage -eq 'Prod') { "$client Planning" } else { "$client Planning [$stage]" }
    $workspace = Get-PowerBIWorkspace -Name $name
    if (-not $workspace) {
        $workspace = New-PowerBIWorkspace -Name $name
        Write-Host "Created $name"
    }
    Add-PowerBIWorkspaceUser -Id $workspace.Id -AccessRight Contributor -PrincipalType Group -Identifier $groupId
}$code$, 'powershell', array['powershell', 'workspaces', 'automation'], 'published', v_author, v_author),
    ('5eed0000-0000-4000-8000-000000040003', null, v_acterys, 'script', 'Acterys allocation stored procedure',
        'Allocates central costs to departments by headcount for a scenario and period. Adapt the table names to the model.',
        $md$## How it works
Reads the central cost per account, the headcount per department, and writes the allocated amounts to the allocation account in the target scenario.

## Before using
- Table and column names are examples: map them to the client's Acterys model.
- Run it in a transaction and reconcile totals afterwards.$md$,
        '', $code$create or alter procedure dbo.usp_allocate_central_costs
    @scenario nvarchar(20),
    @period int
as
begin
    set nocount on;

    with headcount as (
        select department_id, sum(fte) as fte
        from dbo.fact_headcount
        where scenario = @scenario and period = @period
        group by department_id
    ),
    share as (
        select department_id, fte / nullif(sum(fte) over (), 0) as ratio
        from headcount
    ),
    central as (
        select account_id, sum(amount) as amount
        from dbo.fact_plan
        where scenario = @scenario and period = @period and department_id = 'CENTRAL'
        group by account_id
    )
    insert into dbo.fact_plan (scenario, period, department_id, account_id, amount, source)
    select @scenario, @period, s.department_id, c.account_id, round(c.amount * s.ratio, 2), 'allocation'
    from central c cross join share s;
end$code$, 'sql', array['acterys', 'allocation', 'sql'], 'published', v_author, v_author),
    ('5eed0000-0000-4000-8000-000000040004', null, v_fabric, 'script', 'Fabric notebook: bronze to silver',
        'PySpark notebook that de-duplicates a bronze table by business key and merges it into silver.',
        $md$## How to use
Attach the notebook to the silver lakehouse (with the bronze lakehouse added), set the table names and the key, and schedule it after the ingestion pipeline.$md$,
        '', $code$from pyspark.sql import functions as F, Window
from delta.tables import DeltaTable

source = "bronze.erp_gl_entries"
target = "silver.gl_entries"
keys = ["entry_id"]

latest = Window.partitionBy(*keys).orderBy(F.col("_load_date").desc())
df = (
    spark.table(source)
    .withColumn("_rn", F.row_number().over(latest))
    .filter("_rn = 1")
    .drop("_rn")
    .withColumn("amount", F.col("amount").cast("decimal(18,2)"))
    .withColumn("posting_date", F.to_date("posting_date"))
)

if spark.catalog.tableExists(target):
    condition = " and ".join(f"t.{k} = s.{k}" for k in keys)
    (DeltaTable.forName(spark, target).alias("t")
        .merge(df.alias("s"), condition)
        .whenMatchedUpdateAll()
        .whenNotMatchedInsertAll()
        .execute())
else:
    df.write.format("delta").saveAsTable(target)$code$, 'python', array['fabric', 'notebook', 'pyspark'], 'published', v_author, v_author),
    ('5eed0000-0000-4000-8000-000000040005', null, v_pp, 'script', 'Refresh a semantic model from Power Automate',
        'Flow definition (excerpt) that refreshes a Power BI semantic model when a file lands in SharePoint and reports failures.',
        $md$## How to use
Import the pattern into a solution flow, then set the workspace and semantic model in the refresh action. Use a connection reference owned by the service account.$md$,
        '', $code${
  "trigger": {
    "type": "SharePoint.WhenAFileIsCreatedInAFolder",
    "inputs": { "site": "@parameters('SiteUrl')", "folder": "/Shared Documents/Uploads" }
  },
  "actions": {
    "Refresh_a_dataset": {
      "type": "PowerBI.RefreshDataset",
      "inputs": { "groupId": "@parameters('WorkspaceId')", "datasetId": "@parameters('SemanticModelId')" }
    },
    "Notify_on_failure": {
      "type": "Teams.PostMessage",
      "runAfter": { "Refresh_a_dataset": ["Failed", "TimedOut"] },
      "inputs": { "recipient": "@parameters('SupportChannel')", "message": "Refresh failed for @{triggerOutputs()?['body/Name']}" }
    }
  }
}$code$, 'json', array['power-automate', 'refresh'], 'published', v_author, v_author),
    ('5eed0000-0000-4000-8000-000000040006', null, v_pp, 'script', 'Solution checker in a deployment pipeline',
        'YAML pipeline that exports a solution, runs the solution checker and imports it as managed (draft).',
        $md$## Status
Draft: tested in dev only. Still to add: approvals before production.$md$,
        '', $code$trigger: none
pool:
  vmImage: windows-latest
steps:
  - task: PowerPlatformToolInstaller@2
  - task: PowerPlatformExportSolution@2
    inputs:
      authenticationType: PowerPlatformSPN
      PowerPlatformSPN: dev-connection
      SolutionName: $(SolutionName)
      SolutionOutputFile: $(Build.ArtifactStagingDirectory)/$(SolutionName).zip
      Managed: true
  - task: PowerPlatformChecker@2
    inputs:
      PowerPlatformSPN: dev-connection
      FilesToAnalyze: $(Build.ArtifactStagingDirectory)/$(SolutionName).zip
      RuleSet: 0ad12346-e108-40b8-a956-9a8f95ea18c9$code$, 'yaml', array['alm', 'pipeline', 'devops'], 'draft', v_author, v_author),
    ('5eed0000-0000-4000-8000-000000040011', null, v_acterys, 'demo_asset', 'Acterys FP&A demo',
        'Demo tenant with a GL budget, rolling forecast and workforce plan for a fictitious manufacturer.',
        $md$## What to show (30 minutes)
1. Budget input page for a department manager
2. Copy cube to seed the forecast
3. Approval workflow status
4. Budget vs actual report

## Sign-in
Use the shared demo account from the team password vault. Reset the data after each demo with the "Reset demo" button.$md$,
        'https://example.com/demos/acterys-fpa', '', '', array['demo', 'acterys', 'fpa'], 'published', v_author, v_author),
    ('5eed0000-0000-4000-8000-000000040012', null, v_fabric, 'demo_asset', 'Fabric retail analytics demo',
        'End-to-end Fabric demo: pipelines into a medallion lakehouse, Direct Lake model and store performance report.',
        $md$## Storyline
Data arrives nightly from the POS system, is cleaned in silver and modelled in gold; the Direct Lake report shows today's figures without an import refresh.

## Before the demo
Resume the demo capacity at least 10 minutes before (it is paused at night).$md$,
        'https://example.com/demos/fabric-retail', '', '', array['demo', 'fabric', 'retail'], 'published', v_author, v_author),
    ('5eed0000-0000-4000-8000-000000040013', null, v_bpp, 'demo_asset', 'BPP departmental budget demo',
        'Business performance planning demo: Matrix planning visual, allocations and comments on a departmental budget.',
        $md$## What to show
- Entering a budget at department level and allocating it to accounts
- Driver-based salary costs
- Comments on a plan cell$md$,
        'https://example.com/demos/bpp-budget', '', '', array['demo', 'bpp'], 'published', v_author, v_author),
    ('5eed0000-0000-4000-8000-000000040014', null, v_pbi, 'component', 'Corporate report theme',
        'Power BI theme JSON with accessible colours, fonts and visual defaults. Import it in Desktop: View → Themes → Browse.',
        $md$## Customise
Replace the `dataColors` with the client's brand colours; keep at least 4.5:1 contrast for text.$md$,
        '', $code${
  "name": "Knowledge Hub Corporate",
  "dataColors": ["#0F6CBD", "#2886DE", "#13A10E", "#CA5010", "#8764B8", "#038387", "#C239B3", "#986F0B"],
  "background": "#FFFFFF",
  "foreground": "#242424",
  "tableAccent": "#0F6CBD",
  "textClasses": {
    "title": { "fontFace": "Segoe UI Semibold", "fontSize": 14, "color": "#242424" },
    "label": { "fontFace": "Segoe UI", "fontSize": 10, "color": "#424242" }
  }
}$code$, 'json', array['theme', 'design'], 'published', v_author, v_author),
    ('5eed0000-0000-4000-8000-000000040015', null, v_fabric, 'component', 'Standard date dimension',
        'T-SQL that builds a date dimension with fiscal periods, for a Fabric warehouse or an Acterys database.',
        $md$## Parameters
Set the start and end dates and the first month of the fiscal year.$md$,
        '', $code$declare @start date = '2020-01-01', @end date = '2030-12-31', @fiscal_start_month int = 7;

with dates as (
    select @start as d
    union all
    select dateadd(day, 1, d) from dates where d < @end
)
select
    d as [date],
    year(d) as [year],
    month(d) as [month],
    datename(month, d) as month_name,
    year(dateadd(month, 12 - @fiscal_start_month + 1, d)) as fiscal_year,
    ((month(d) - @fiscal_start_month + 12) % 12) + 1 as fiscal_period
into dbo.dim_date
from dates
option (maxrecursion 0);$code$, 'sql', array['date', 'dimension', 'sql'], 'published', v_author, v_author),
    ('5eed0000-0000-4000-8000-000000040016', null, null, 'template', 'Data mapping workbook',
        'Excel template to map source fields to the target model, with owners and transformation rules.',
        $md$## Tabs
- **Sources:** systems, owners, access
- **Mapping:** source table.field → target table.column, rule, status
- **Hierarchies:** chart of accounts and entity mapping

Send it to the client after the discovery workshop.$md$,
        'https://example.com/templates/data-mapping.xlsx', '', '', array['template', 'mapping', 'discovery'], 'published', v_author, v_author),
    ('5eed0000-0000-4000-8000-000000040017', null, null, 'template', 'UAT test script',
        'Test cases with steps, expected results and sign-off, for user acceptance testing.',
        $md$## Columns
| ID | Scenario | Steps | Expected result | Tester | Pass/Fail | Notes |
|---|---|---|---|---|---|---|
| UAT-01 | Enter a budget | Open the input page, enter values for 3 accounts | Values saved, totals update | | | |
| UAT-02 | Submit for approval | Submit the department | Status Submitted, input locked | | | |

## Sign-off
The client's project lead signs once all critical cases pass.$md$,
        '', '', '', array['template', 'uat', 'testing'], 'published', v_author, v_author)
    on conflict do nothing;

    -- Reference architectures with diagrams
    insert into public.library_assets (id, client_id, product_id, kind, title, summary, body, url, tags, status, diagram, created_by, updated_by) values
    ('5eed0000-0000-4000-8000-000000040021', null, v_acterys, 'reference_architecture', 'Acterys FP&A on Azure SQL',
        'GL budgeting and forecasting with Acterys: ERP actuals loaded to Azure SQL, write-back planning, approval and Power BI reporting.',
        $md$## When to use
Clients planning on the general ledger who already use Power BI. Add the workforce view when headcount planning is in scope.

## Components
ERP extract → staging in the Acterys database → planning cube with write-back → approval → materialized reporting facts → Power BI.$md$,
        '', array['acterys', 'fpa', 'architecture'], 'published',
        $j${"views": [
          {"id": "v-gl", "name": "GL planning only",
           "description": "Budget and forecast on the general ledger: actuals loaded from the ERP, planned in a write-back cube, approved, then materialized for reporting.",
           "nodes": [
             {"id": "n-erp", "kind": "source_system", "label": "Financials from ERP", "subtitle": "GL actuals, chart of accounts", "x": 0, "y": 180, "step": 1, "guidance": "Agree the extract with the client: GL balances by period, the chart of accounts and entities. Confirm the refresh frequency."},
             {"id": "n-db", "kind": "database", "label": "Acterys SQL database", "subtitle": "Azure SQL", "x": 300, "y": 180, "step": 1, "guidance": "Create staging tables and load them with a Fabric pipeline (or Azure Data Factory)."},
             {"id": "n-cube", "kind": "cube", "label": "Planning cube", "subtitle": "Budget and forecast (write-back)", "x": 600, "y": 180, "step": 2, "guidance": "Model the cube on account, entity, period and scenario. Only Budget and Forecast are writable."},
             {"id": "n-copy", "kind": "action", "label": "Copy cube", "subtitle": "Seeds the forecast from actuals", "x": 450, "y": 20, "step": null, "guidance": ""},
             {"id": "n-scen", "kind": "dimension", "label": "Dim_Scenario", "subtitle": "Actual, Budget, Forecast", "x": 750, "y": 20, "step": null, "guidance": ""},
             {"id": "n-planner", "kind": "person", "label": "Planner / Approver", "subtitle": "Finance team", "x": 300, "y": 360, "step": null, "guidance": ""},
             {"id": "n-wf", "kind": "dimension", "label": "Dim_WorkflowApproval", "subtitle": "Approval status per entity", "x": 600, "y": 360, "step": 3, "guidance": "One member per entity with a status; lock input once submitted."},
             {"id": "n-proc", "kind": "procedure", "label": "Stored procedure: materialize", "subtitle": "Runs on approval", "x": 900, "y": 360, "step": 3, "guidance": "Copies approved plan values into the reporting fact table."},
             {"id": "n-fact", "kind": "fact", "label": "Materialized financials", "subtitle": "Actuals + approved plan", "x": 900, "y": 180, "step": null, "guidance": ""},
             {"id": "n-report", "kind": "report", "label": "Power BI financial reports", "subtitle": "P&L, budget vs actual", "x": 1200, "y": 180, "step": 4, "guidance": "Build on a shared semantic model over the materialized facts."}
           ],
           "edges": [
             {"id": "e1", "source": "n-erp", "target": "n-db", "label": "Fabric pipeline"},
             {"id": "e2", "source": "n-db", "target": "n-cube", "label": "loads actuals"},
             {"id": "e3", "source": "n-copy", "target": "n-cube", "label": ""},
             {"id": "e4", "source": "n-scen", "target": "n-cube", "label": ""},
             {"id": "e5", "source": "n-planner", "target": "n-wf", "label": "submit / approve"},
             {"id": "e6", "source": "n-wf", "target": "n-proc", "label": "triggers"},
             {"id": "e7", "source": "n-cube", "target": "n-proc", "label": "reads"},
             {"id": "e8", "source": "n-proc", "target": "n-fact", "label": "writes"},
             {"id": "e9", "source": "n-fact", "target": "n-report", "label": ""}
           ],
           "notes": [
             {"id": "note-1", "tone": "warning", "text": "Fabric pipelines can load Azure SQL, but if the client has no Fabric, Azure Data Factory is the simpler fit."}
           ]},
          {"id": "v-wf", "name": "Workforce planning add-on",
           "description": "Position-level headcount plan from HR data, salary drivers, and salary costs posted into the GL plan.",
           "nodes": [
             {"id": "w-hr", "kind": "source_system", "label": "HR system", "subtitle": "Positions, salaries", "x": 0, "y": 120, "step": 1, "guidance": "Agree which HR fields may be loaded (personal data!)."},
             {"id": "w-file", "kind": "file", "label": "Salary rates", "subtitle": "Excel upload", "x": 0, "y": 300, "step": 1, "guidance": ""},
             {"id": "w-cube", "kind": "cube", "label": "Workforce cube", "subtitle": "Positions × month", "x": 320, "y": 200, "step": 2, "guidance": "Planners add, change and end positions with the table input."},
             {"id": "w-proc", "kind": "procedure", "label": "Salary cost calculation", "subtitle": "FTE × rate + on-costs", "x": 640, "y": 200, "step": 3, "guidance": ""},
             {"id": "w-gl", "kind": "cube", "label": "GL planning cube", "subtitle": "Salary accounts", "x": 960, "y": 200, "step": 3, "guidance": "Post salary costs to the salary accounts by cost centre."}
           ],
           "edges": [
             {"id": "we1", "source": "w-hr", "target": "w-cube", "label": "positions"},
             {"id": "we2", "source": "w-file", "target": "w-cube", "label": "rates"},
             {"id": "we3", "source": "w-cube", "target": "w-proc", "label": ""},
             {"id": "we4", "source": "w-proc", "target": "w-gl", "label": "salary costs"}
           ],
           "notes": [
             {"id": "note-w1", "tone": "info", "text": "Restrict the workforce cube to HR and finance controllers: it contains salary data."}
           ]}
        ]}$j$::jsonb, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000040022', null, v_fabric, 'reference_architecture', 'Fabric medallion lakehouse',
        'Sources landed in bronze by pipelines, cleaned in silver and modelled in gold, served by a Direct Lake semantic model.',
        $md$## When to use
Clients consolidating several sources for analytics on Fabric. Combine with the Acterys or BPP architectures when planning is in scope.$md$,
        '', array['fabric', 'medallion', 'architecture'], 'published',
        $j${"views": [
          {"id": "v-med", "name": "Medallion lakehouse",
           "description": "Bronze, silver and gold lakehouses in OneLake, loaded by pipelines and notebooks, read by a Direct Lake semantic model.",
           "nodes": [
             {"id": "m-erp", "kind": "source_system", "label": "ERP", "subtitle": "Azure SQL replica", "x": 0, "y": 40, "step": 1, "guidance": ""},
             {"id": "m-pos", "kind": "source_system", "label": "POS / e-commerce", "subtitle": "REST API", "x": 0, "y": 200, "step": 1, "guidance": ""},
             {"id": "m-files", "kind": "file", "label": "Budget files", "subtitle": "SharePoint", "x": 0, "y": 360, "step": 1, "guidance": ""},
             {"id": "m-pipe", "kind": "pipeline", "label": "Data pipelines", "subtitle": "Nightly, incremental", "x": 300, "y": 200, "step": 1, "guidance": "Copy activities with watermarks; alert on failure."},
             {"id": "m-bronze", "kind": "fabric_lakehouse", "label": "Bronze lakehouse", "subtitle": "Raw copies", "x": 600, "y": 200, "step": 2, "guidance": "Keep the source shape and add load metadata."},
             {"id": "m-silver", "kind": "fabric_lakehouse", "label": "Silver lakehouse", "subtitle": "Cleaned, de-duplicated", "x": 900, "y": 200, "step": 3, "guidance": "Notebooks merge into Delta tables."},
             {"id": "m-gold", "kind": "fabric_lakehouse", "label": "Gold lakehouse", "subtitle": "Facts and dimensions", "x": 1200, "y": 200, "step": 4, "guidance": "Star schema: the contract with the semantic model."},
             {"id": "m-model", "kind": "semantic_model", "label": "Semantic model", "subtitle": "Direct Lake", "x": 1500, "y": 200, "step": 5, "guidance": ""},
             {"id": "m-report", "kind": "report", "label": "Power BI reports", "subtitle": "Store performance", "x": 1800, "y": 200, "step": 5, "guidance": ""}
           ],
           "edges": [
             {"id": "me1", "source": "m-erp", "target": "m-pipe", "label": ""},
             {"id": "me2", "source": "m-pos", "target": "m-pipe", "label": ""},
             {"id": "me3", "source": "m-files", "target": "m-pipe", "label": ""},
             {"id": "me4", "source": "m-pipe", "target": "m-bronze", "label": "copy"},
             {"id": "me5", "source": "m-bronze", "target": "m-silver", "label": "notebook"},
             {"id": "me6", "source": "m-silver", "target": "m-gold", "label": "notebook"},
             {"id": "me7", "source": "m-gold", "target": "m-model", "label": "Direct Lake"},
             {"id": "me8", "source": "m-model", "target": "m-report", "label": ""}
           ],
           "notes": [
             {"id": "note-m1", "tone": "info", "text": "Below F64, report readers need Power BI Pro licences."},
             {"id": "note-m2", "tone": "warning", "text": "On-premises sources need an on-premises data gateway."}
           ]}
        ]}$j$::jsonb, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000040023', null, v_pp, 'reference_architecture', 'Power Platform approvals with a Copilot agent',
        'Requests in a Power App, approvals in Teams via Power Automate, data in Dataverse, and a Copilot Studio agent answering how-to questions from Knowledge Hub.',
        $md$## When to use
Process automation where people submit requests and managers approve, plus a self-service agent for questions.$md$,
        '', array['power-platform', 'copilot', 'architecture'], 'published',
        $j${"views": [
          {"id": "v-pp", "name": "Approvals and agent",
           "description": "A Power App writes requests to Dataverse; a flow routes approvals in Teams; a Copilot Studio agent answers questions from Knowledge Hub.",
           "nodes": [
             {"id": "p-user", "kind": "person", "label": "Requester", "subtitle": "Store manager", "x": 0, "y": 160, "step": null, "guidance": ""},
             {"id": "p-app", "kind": "power_app", "label": "Request app", "subtitle": "Canvas app", "x": 300, "y": 160, "step": 2, "guidance": "Inside a solution; uses environment variables."},
             {"id": "p-dv", "kind": "dataverse", "label": "Dataverse", "subtitle": "Requests table", "x": 600, "y": 160, "step": 1, "guidance": "Create the table and security roles first."},
             {"id": "p-flow", "kind": "pipeline", "label": "Approval flow", "subtitle": "Power Automate", "x": 900, "y": 160, "step": 3, "guidance": "Owned by a service account; error handling scope."},
             {"id": "p-teams", "kind": "teams_channel", "label": "Approver in Teams", "subtitle": "Approvals app", "x": 1200, "y": 160, "step": 3, "guidance": ""},
             {"id": "p-agent", "kind": "copilot_agent", "label": "Store ops agent", "subtitle": "Copilot Studio", "x": 300, "y": 360, "step": 4, "guidance": "Add the Knowledge Hub REST API tool with an API key scoped to the client."},
             {"id": "p-kh", "kind": "service", "label": "Knowledge Hub API", "subtitle": "/api/v1", "x": 600, "y": 360, "step": 4, "guidance": ""}
           ],
           "edges": [
             {"id": "pe1", "source": "p-user", "target": "p-app", "label": "submits"},
             {"id": "pe2", "source": "p-app", "target": "p-dv", "label": "writes"},
             {"id": "pe3", "source": "p-dv", "target": "p-flow", "label": "row added"},
             {"id": "pe4", "source": "p-flow", "target": "p-teams", "label": "approval"},
             {"id": "pe5", "source": "p-user", "target": "p-agent", "label": "asks"},
             {"id": "pe6", "source": "p-agent", "target": "p-kh", "label": "search / get article"}
           ],
           "notes": [
             {"id": "note-p1", "tone": "warning", "text": "Dataverse is a premium connector: requesters need premium licences or a per-app plan."}
           ]}
        ]}$j$::jsonb, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000040024', null, v_bpp, 'reference_architecture', 'BPP planning on Dataverse',
        'Business performance planning: actuals from Dynamics 365 Finance into Dataverse cubes, planning in Power BI visuals, plan values back to Finance.',
        $md$## When to use
Clients on Dynamics 365 Finance who want planning without a separate planning database.$md$,
        '', array['bpp', 'dataverse', 'architecture'], 'published',
        $j${"views": [
          {"id": "v-bpp", "name": "Departmental budget",
           "description": "Actuals and master data from Finance feed BPP cubes in Dataverse; planners use the Matrix planning visual in Power BI.",
           "nodes": [
             {"id": "b-fin", "kind": "source_system", "label": "Dynamics 365 Finance", "subtitle": "Actuals, dimensions", "x": 0, "y": 160, "step": 1, "guidance": "Confirm the financial dimensions to plan on."},
             {"id": "b-dv", "kind": "dataverse", "label": "Dataverse", "subtitle": "BPP cubes", "x": 320, "y": 160, "step": 2, "guidance": "Define the cube at month × account × department."},
             {"id": "b-model", "kind": "semantic_model", "label": "Planning semantic model", "subtitle": "Power BI", "x": 640, "y": 160, "step": 3, "guidance": ""},
             {"id": "b-visual", "kind": "report", "label": "Planning report", "subtitle": "Matrix planning visual", "x": 960, "y": 160, "step": 3, "guidance": "Lock actual periods; one department per page."},
             {"id": "b-planner", "kind": "person", "label": "Department managers", "subtitle": "Planners", "x": 960, "y": 340, "step": null, "guidance": ""},
             {"id": "b-alloc", "kind": "action", "label": "Allocations and drivers", "subtitle": "Salary × FTE", "x": 640, "y": 340, "step": 4, "guidance": ""}
           ],
           "edges": [
             {"id": "be1", "source": "b-fin", "target": "b-dv", "label": "actuals"},
             {"id": "be2", "source": "b-dv", "target": "b-model", "label": ""},
             {"id": "be3", "source": "b-model", "target": "b-visual", "label": ""},
             {"id": "be4", "source": "b-planner", "target": "b-visual", "label": "enter plan"},
             {"id": "be5", "source": "b-visual", "target": "b-dv", "label": "write-back"},
             {"id": "be6", "source": "b-alloc", "target": "b-dv", "label": ""}
           ],
           "notes": [
             {"id": "note-b1", "tone": "info", "text": "Check that a Dataverse environment is linked to Finance in week 1."}
           ]}
        ]}$j$::jsonb, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000040025', c_contoso, v_acterys, 'reference_architecture', 'Contoso target architecture',
        'Contoso: D365 Finance actuals through their Fabric workspace into the Acterys database; budget and forecast in Power BI.',
        $md$Agreed in week 3 (see the Contoso decisions log).$md$,
        '', array['contoso', 'architecture'], 'published',
        $j${"views": [
          {"id": "v-contoso", "name": "Phase 1",
           "description": "GL budget and rolling forecast for 14 entities.",
           "nodes": [
             {"id": "c-d365", "kind": "source_system", "label": "D365 Finance", "subtitle": "Contoso tenant", "x": 0, "y": 160, "step": 1, "guidance": ""},
             {"id": "c-fabric", "kind": "fabric_lakehouse", "label": "Contoso Finance Data", "subtitle": "Fabric lakehouse", "x": 300, "y": 160, "step": 1, "guidance": "Owned by the Contoso data platform team."},
             {"id": "c-db", "kind": "database", "label": "acterys-contoso-prod", "subtitle": "Azure SQL", "x": 600, "y": 160, "step": 2, "guidance": ""},
             {"id": "c-report", "kind": "report", "label": "Contoso Planning", "subtitle": "Power BI app", "x": 900, "y": 160, "step": 3, "guidance": ""}
           ],
           "edges": [
             {"id": "ce1", "source": "c-d365", "target": "c-fabric", "label": "Fabric link"},
             {"id": "ce2", "source": "c-fabric", "target": "c-db", "label": "pipeline"},
             {"id": "ce3", "source": "c-db", "target": "c-report", "label": "write-back"}
           ],
           "notes": []}
        ]}$j$::jsonb, v_author, v_author)
    on conflict do nothing;

    -- ── Intake questions (product-specific additions) ─────────────────────────────────────────────

    insert into public.intake_questions (key, section, label, help, type, options, required, product_id, position) values
    ('pbi_report_count', 'Power BI', 'How many reports are in scope?', 'Rough number; existing reports to migrate count too.', 'number', '[]', false, v_pbi, 130),
    ('pbi_existing_models', 'Power BI', 'Are there existing semantic models we should reuse?', '', 'yes_no', '[]', false, v_pbi, 140),
    ('bpp_dataverse_env', 'BPP', 'Is a Dataverse environment linked to Dynamics 365 Finance?', 'BPP stores its cubes in Dataverse.', 'yes_no', '[]', false, v_bpp, 150),
    ('bpp_visuals', 'BPP', 'How will planners enter data?', '', 'multi_choice', $j$[
        {"value": "matrix", "label": "Grid by account and period (Matrix planning visual)"},
        {"value": "table_edit", "label": "Lists of items (Table edit visual)"}
    ]$j$::jsonb, false, v_bpp, 160),
    ('fabric_existing', 'Fabric', 'Does the client already have Fabric workspaces in use?', '', 'yes_no', '[]', false, v_fabric, 170),
    ('pp_process_count', 'Power Platform', 'How many processes should be automated?', '', 'number', '[]', false, v_pp, 180),
    ('pp_copilot_agent', 'Power Platform', 'Is a Copilot Studio agent in scope?', 'For example an agent that answers questions from our knowledge.', 'yes_no', '[]', false, v_pp, 190)
    on conflict (key) do nothing;

    -- ── Intake rules linked to the sample knowledge ───────────────────────────────────────────────

    insert into public.intake_rules (id, title, kind, product_id, match, conditions, guidance, show_to_customer, article_ids, asset_ids, position) values
    ('5eed0000-0000-4000-8000-000000070001', 'Near-real-time data on Fabric', 'gotcha', v_fabric, 'all',
        '[{"questionKey": "refresh_frequency", "operator": "equals", "value": "near_real_time"}]',
        'Nightly pipelines won''t meet this. Consider **Real-Time Intelligence** (Eventstreams, Eventhouse) or DirectQuery for the live part, and size the capacity for it.',
        false, array['5eed0000-0000-4000-8000-000000030407']::uuid[], array['5eed0000-0000-4000-8000-000000040022']::uuid[], 60),
    ('5eed0000-0000-4000-8000-000000070002', 'BPP needs a linked Dataverse environment', 'gotcha', v_bpp, 'any',
        '[{"questionKey": "bpp_dataverse_env", "operator": "equals", "value": "no"}, {"questionKey": "bpp_dataverse_env", "operator": "not_answered", "value": ""}]',
        'Provision and link a **Dataverse environment** to Finance before the build starts; it is on the critical path.',
        false, array['5eed0000-0000-4000-8000-000000030206']::uuid[], array['5eed0000-0000-4000-8000-000000040024']::uuid[], 70),
    ('5eed0000-0000-4000-8000-000000070003', 'Copilot agent on Knowledge Hub', 'best_practice', v_pp, 'all',
        '[{"questionKey": "pp_copilot_agent", "operator": "equals", "value": "yes"}]',
        'Ground the agent on **published** knowledge through the Knowledge Hub API, with a key scoped to the client. Agree who keeps the knowledge up to date.',
        true, array['5eed0000-0000-4000-8000-000000030505']::uuid[], array['5eed0000-0000-4000-8000-000000040023']::uuid[], 80),
    ('5eed0000-0000-4000-8000-000000070004', 'Many reports: share semantic models', 'best_practice', v_pbi, 'all',
        '[{"questionKey": "pbi_report_count", "operator": "greater_than", "value": "20"}]',
        'Build a few **shared semantic models** by subject area instead of one model per report, and certify them.',
        true, array['5eed0000-0000-4000-8000-000000030101']::uuid[], '{}', 90),
    ('5eed0000-0000-4000-8000-000000070005', 'Workforce planning in scope', 'best_practice', v_acterys, 'all',
        '[{"questionKey": "planning_cycle", "operator": "includes", "value": "workforce"}]',
        'Plan workforce as a second phase after the GL budget is live, with salary data restricted to HR and finance controllers.',
        true, array['5eed0000-0000-4000-8000-000000030307']::uuid[], array['5eed0000-0000-4000-8000-000000040021']::uuid[], 100),
    ('5eed0000-0000-4000-8000-000000070006', 'ERP data: map it early', 'best_practice', null, 'all',
        '[{"questionKey": "data_sources", "operator": "includes", "value": "erp"}]',
        'Send the **data mapping workbook** after the workshop and agree the chart of accounts mapping in writing before building.',
        true, array['5eed0000-0000-4000-8000-000000030601']::uuid[], array['5eed0000-0000-4000-8000-000000040016']::uuid[], 110)
    on conflict do nothing;

    -- ── Discovery intakes ─────────────────────────────────────────────────────────────────────────

    insert into public.intakes (id, client_id, title, status, product_ids, answers, notes, created_by, updated_by) values
    ('5eed0000-0000-4000-8000-000000050001', c_contoso, 'Phase 1 discovery: GL budget and forecast', 'complete',
        array_remove(array[v_acterys, v_pbi, v_fabric], null),
        $j${
            "business_goal": "Replace 40 budget spreadsheets with one planning model so the annual budget takes 6 weeks instead of 12, and run a monthly rolling forecast.",
            "stakeholders": "CFO (sponsor), FP&A manager (project lead), 14 entity controllers, data platform lead.",
            "go_live": "Before the FY26 budget cycle (September)",
            "user_count": "60",
            "data_sources": ["erp", "excel"],
            "on_premises": "no",
            "data_volume": "medium",
            "security": "yes",
            "licensing": ["pbi_pro", "fabric", "m365"],
            "planning_cycle": ["budget", "forecast", "workforce"],
            "write_back": "yes",
            "refresh_frequency": "daily",
            "pbi_report_count": "12",
            "pbi_existing_models": "no",
            "fabric_existing": "yes"
        }$j$::jsonb,
        'Workforce planning confirmed as phase 2. Entity controllers only see their own entity.', v_author, v_author),
    ('5eed0000-0000-4000-8000-000000050002', c_northwind, 'Store analytics and agent discovery', 'in_review',
        array_remove(array[v_fabric, v_pbi, v_pp], null),
        $j${
            "business_goal": "Give 300 store managers daily store performance and a self-service agent for operations questions.",
            "stakeholders": "Head of retail operations, IT director.",
            "go_live": "Q2",
            "user_count": "300",
            "data_sources": ["sql", "api", "sharepoint"],
            "on_premises": "yes",
            "data_volume": "large",
            "security": "yes",
            "licensing": ["pbi_pro", "m365"],
            "refresh_frequency": "near_real_time",
            "pbi_report_count": "25",
            "fabric_existing": "no",
            "pp_process_count": "3",
            "pp_copilot_agent": "yes"
        }$j$::jsonb,
        'Waiting for the IT director to confirm the Fabric capacity size.', v_author, v_author),
    ('5eed0000-0000-4000-8000-000000050003', c_fabrikam, 'BPP discovery (draft)', 'draft',
        array_remove(array[v_bpp], null),
        $j${
            "business_goal": "Departmental budgets for 30 hospital departments, planned in BPP instead of Excel.",
            "data_sources": ["erp", "excel"],
            "bpp_visuals": ["matrix", "table_edit"]
        }$j$::jsonb,
        '', v_author, v_author)
    on conflict do nothing;

    -- ── BRDs ──────────────────────────────────────────────────────────────────────────────────────

    insert into public.brds (id, client_id, intake_id, audience, title, status, body, milestones, created_by, updated_by) values
    ('5eed0000-0000-4000-8000-000000060001', c_contoso, '5eed0000-0000-4000-8000-000000050001', 'customer',
        'Contoso Manufacturing: planning solution BRD', 'final',
        $md$## Overview
Contoso Manufacturing will replace 40 budget spreadsheets with one planning model so the annual budget takes 6 weeks instead of 12, and run a monthly rolling forecast.

## Scope
### In scope
- GL budget and monthly rolling forecast for 14 entities
- Approval workflow by entity
- Budget vs actual reporting in Power BI

### Out of scope (phase 2)
- Workforce planning
- CapEx planning

## Reference architecture
Actuals from Dynamics 365 Finance flow through the Contoso Fabric workspace into the Acterys planning database. Planners enter the budget and forecast in Power BI; approved plans are materialized for reporting. See **Acterys FP&A on Azure SQL** in the library.

## Demo
The [Acterys FP&A demo](https://example.com/demos/acterys-fpa) shows the budget input, forecast and approval steps.

## Recommendations
- Design row-level security with the semantic model from day one: entity controllers see only their entity.
- Agree the chart of accounts mapping in writing before building.

## Users and security
60 users: 14 entity controllers (planners), the FP&A team (approvers) and report readers.$md$,
        $j$[
            {"title": "Design", "deliverables": ["Acterys model design", "Security matrix", "Data mapping"], "dependencies": ["Chart of accounts and entity list from Contoso"], "owner": "FP&A manager", "due": "Week 3"},
            {"title": "Build", "deliverables": ["Actuals load", "Budget and forecast input pages", "Approval workflow"], "dependencies": ["Acterys licences provisioned", "Access to the Fabric workspace"], "owner": "Delivery lead", "due": "Week 8"},
            {"title": "Test and go-live", "deliverables": ["UAT with 3 entity controllers", "Training", "Go-live"], "dependencies": ["UAT testers available"], "owner": "FP&A manager", "due": "Week 11"}
        ]$j$::jsonb, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000060002', c_contoso, '5eed0000-0000-4000-8000-000000050001', 'internal',
        'Contoso Manufacturing: internal delivery brief', 'draft',
        $md$## Summary
Acterys GL budget and forecast for 14 entities, actuals through the client's Fabric workspace. Fixed go-live before the FY26 budget cycle.

## Gotchas
- **Write-back planning:** every contributor needs an Acterys licence; 60 users but only 40 licences quoted so far.
- Workforce is in the planning cycle answers but is **phase 2**: keep it out of the phase 1 plan.

## Learning materials
- [Acterys platform overview](/knowledge/articles/5eed0000-0000-4000-8000-000000030301)
- [Build a budget input template](/knowledge/articles/5eed0000-0000-4000-8000-000000030304)
- [Approval workflow](/knowledge/articles/5eed0000-0000-4000-8000-000000030306)

## Scripts and components
- [Acterys allocation stored procedure](/library/5eed0000-0000-4000-8000-000000040003)
- [Standard date dimension](/library/5eed0000-0000-4000-8000-000000040015)
- [Corporate report theme](/library/5eed0000-0000-4000-8000-000000040014)

## Demo assets
- [Acterys FP&A demo](/library/5eed0000-0000-4000-8000-000000040011)

## Risks
- Contoso's data platform team owns the Fabric workspace: changes go through their backlog.
- Entity controllers are busy at month end: avoid UAT in the first week of a month.$md$,
        $j$[
            {"title": "Design", "deliverables": ["Acterys model design", "Security matrix", "Data mapping workbook completed"], "dependencies": ["Chart of accounts from Contoso"], "owner": "Solution architect", "due": "Week 3"},
            {"title": "Build", "deliverables": ["Pipeline from Fabric to Azure SQL", "Planning cube and copy cube", "Input templates", "Approval workflow and notifications"], "dependencies": ["Licences", "Service account svc-planning"], "owner": "Delivery lead", "due": "Week 8"},
            {"title": "Test and go-live", "deliverables": ["UAT script", "Training sessions", "Handover checklist"], "dependencies": ["UAT testers"], "owner": "Delivery lead", "due": "Week 11"}
        ]$j$::jsonb, v_author, v_author),
    ('5eed0000-0000-4000-8000-000000060003', c_northwind, '5eed0000-0000-4000-8000-000000050002', 'customer',
        'Northwind Retail: store analytics BRD (draft)', 'draft',
        $md$## Overview
Give 300 store managers daily store performance and a self-service agent for operations questions.

## Reference architecture
A Fabric medallion lakehouse with a Direct Lake semantic model for reporting, Power Automate approvals, and a Copilot Studio agent grounded on published store operations knowledge.

## Open points
- Fabric capacity size (to be confirmed by IT)
- Whether "near real time" is needed for all stores or only for the flagship stores$md$,
        $j$[
            {"title": "Fabric foundation", "deliverables": ["Workspaces and capacity", "Medallion lakehouses", "Ingestion pipelines"], "dependencies": ["Fabric capacity purchased", "On-premises gateway server"], "owner": "", "due": ""},
            {"title": "Reporting", "deliverables": ["Direct Lake semantic model", "Store performance report"], "dependencies": ["Data validated by Northwind"], "owner": "", "due": ""},
            {"title": "Agent", "deliverables": ["Copilot Studio agent", "Knowledge Hub API key"], "dependencies": ["Store operations manual published in Knowledge Hub"], "owner": "", "due": ""}
        ]$j$::jsonb, v_author, v_author)
    on conflict do nothing;
end
$seed$;

-- ════════════════════════════════════════════════════════════════════════════════════════════════
-- Remove the sample data (uncomment and run). Rules and BRDs go first; clients cascade to their
-- intakes, BRDs and client-specific knowledge.
-- ════════════════════════════════════════════════════════════════════════════════════════════════
-- delete from public.intake_rules where id::text like '5eed0000-%';
-- delete from public.brds where id::text like '5eed0000-%';
-- delete from public.intakes where id::text like '5eed0000-%';
-- delete from public.articles where id::text like '5eed0000-%';
-- delete from public.library_assets where id::text like '5eed0000-%';
-- delete from public.collections where id::text like '5eed0000-%';
-- delete from public.clients where id::text like '5eed0000-%';
-- delete from public.intake_questions where key in ('pbi_report_count', 'pbi_existing_models', 'bpp_dataverse_env', 'bpp_visuals', 'fabric_existing', 'pp_process_count', 'pp_copilot_agent');
-- delete from public.diagram_components where code in ('dataverse', 'fabric_lakehouse', 'semantic_model', 'power_app', 'copilot_agent', 'teams_channel');
