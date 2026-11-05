-- ════════════════════════════════════════════════════════════════════════════════════════════════
-- Knowledge Hub — starting reference data. Everything here is editable by administrators in the app
-- (Admin → Products, Admin → Intake), so treat it as a sensible default, not a rule.
-- ════════════════════════════════════════════════════════════════════════════════════════════════

insert into public.products (code, name, description, theme, sort_order, milestone_template) values
('acterys', 'Acterys', 'Planning, budgeting and forecasting on Power BI and Azure.', 'violet', 1, '[
    {"title": "Acterys model design", "deliverables": ["Dimension and measure design", "Planning cube / write-back model"], "dependencies": ["Chart of accounts and hierarchies from the client"]},
    {"title": "Planning templates", "deliverables": ["Input templates", "Allocation and approval workflow"], "dependencies": ["Acterys licences provisioned"]}
]'),
('bpp', 'BPP', 'Business planning & performance solutions.', 'amber', 2, '[
    {"title": "BPP configuration", "deliverables": ["Planning process configuration", "Driver-based models"], "dependencies": ["Agreed planning calendar"]}
]'),
('fabric', 'Microsoft Fabric', 'Lakehouse, pipelines, notebooks and semantic models on Microsoft Fabric.', 'teal', 3, '[
    {"title": "Fabric foundation", "deliverables": ["Workspaces and capacity", "Lakehouse / warehouse", "Ingestion pipelines"], "dependencies": ["Fabric capacity purchased", "Source system access"]},
    {"title": "Semantic model & reports", "deliverables": ["Semantic model", "Core reports"], "dependencies": ["Data validated by the client"]}
]'),
('power-bi', 'Power BI', 'Reports, dashboards and semantic models.', 'blue', 4, '[
    {"title": "Reporting", "deliverables": ["Semantic model", "Report pages", "Row-level security"], "dependencies": ["Report mock-ups approved"]}
]'),
('power-platform', 'Power Platform', 'Power Automate flows, Power Apps and Copilot Studio agents.', 'green', 5, '[
    {"title": "Automation", "deliverables": ["Power Automate flows", "Environment and connection setup"], "dependencies": ["Service accounts and connector licences"]}
]');

-- ── A starting discovery questionnaire ────────────────────────────────────────────────────────────

insert into public.intake_questions (key, section, label, help, type, options, required, product_id, position) values
('business_goal', 'Business context', 'What problem are we solving, and what does success look like?',
    'In the client’s words. This becomes the overview of the customer BRD.', 'long_text', '[]', true, null, 10),
('stakeholders', 'Business context', 'Who are the key stakeholders and decision makers?', '', 'long_text', '[]', false, null, 20),
('go_live', 'Business context', 'Target go-live date or deadline', 'A date or a period, e.g. “before FY26 budget cycle”.', 'text', '[]', false, null, 30),
('user_count', 'Scope', 'How many people will use the solution?', '', 'number', '[]', false, null, 40),
('data_sources', 'Data', 'Which source systems hold the data?', 'Select everything that applies.', 'multi_choice', '[
    {"value": "erp", "label": "ERP (e.g. Dynamics, SAP, NetSuite)"},
    {"value": "excel", "label": "Excel / CSV files"},
    {"value": "sql", "label": "SQL databases"},
    {"value": "sharepoint", "label": "SharePoint / OneDrive"},
    {"value": "api", "label": "Cloud apps via API"},
    {"value": "other", "label": "Other"}
]', true, null, 50),
('on_premises', 'Data', 'Is any source data on-premises?', 'On-premises data needs a data gateway.', 'yes_no', '[]', false, null, 60),
('data_volume', 'Data', 'Approximate data volume', '', 'single_choice', '[
    {"value": "small", "label": "Under 1 GB"},
    {"value": "medium", "label": "1 – 50 GB"},
    {"value": "large", "label": "Over 50 GB"}
]', false, null, 70),
('security', 'Security', 'Does anyone need to see only part of the data (row-level security)?', '', 'yes_no', '[]', false, null, 80),
('licensing', 'Licensing', 'Which Microsoft licences does the client already have?', '', 'multi_choice', '[
    {"value": "pbi_pro", "label": "Power BI Pro"},
    {"value": "pbi_premium", "label": "Power BI Premium / PPU"},
    {"value": "fabric", "label": "Fabric capacity"},
    {"value": "m365", "label": "Microsoft 365 E3/E5"},
    {"value": "none", "label": "Not sure / none"}
]', false, null, 90),
('planning_cycle', 'Planning', 'Which planning processes are in scope?', '', 'multi_choice', '[
    {"value": "budget", "label": "Annual budget"},
    {"value": "forecast", "label": "Rolling forecast"},
    {"value": "workforce", "label": "Workforce planning"},
    {"value": "capex", "label": "CapEx planning"}
]', false, (select id from public.products where code = 'acterys'), 100),
('write_back', 'Planning', 'Do users need to enter or adjust numbers (write-back)?', '', 'yes_no', '[]', false,
    (select id from public.products where code = 'acterys'), 110),
('refresh_frequency', 'Fabric', 'How fresh must the data be?', '', 'single_choice', '[
    {"value": "daily", "label": "Daily"},
    {"value": "hourly", "label": "Hourly"},
    {"value": "near_real_time", "label": "Near real time"}
]', false, (select id from public.products where code = 'fabric'), 120);

-- ── Example IF/ELSE rules (edit or replace with your own in Admin → Intake) ───────────────────────

insert into public.intake_rules (title, kind, match, conditions, guidance, show_to_customer, position) values
('On-premises data needs a gateway', 'gotcha', 'all',
    '[{"questionKey": "on_premises", "operator": "equals", "value": "yes"}]',
    'Plan for an **on-premises data gateway**: a server (or VM) the client provides, a service account, and firewall rules. Raise it in the first workshop — it is often the longest lead-time item.',
    false, 10),
('Row-level security from day one', 'best_practice', 'all',
    '[{"questionKey": "security", "operator": "equals", "value": "yes"}]',
    'Design **row-level security** roles with the semantic model rather than adding them at the end. Agree the security matrix (who sees which entities) as a deliverable of the design milestone.',
    true, 20),
('No Fabric or Premium licence yet', 'gotcha', 'any',
    '[{"questionKey": "licensing", "operator": "includes", "value": "none"}, {"questionKey": "licensing", "operator": "not_answered", "value": ""}]',
    'Licensing is unconfirmed. Confirm capacity / Premium requirements **before** the architecture is signed off — it changes the reference architecture and the cost.',
    false, 30),
('Large data volumes', 'best_practice', 'all',
    '[{"questionKey": "data_volume", "operator": "equals", "value": "large"}]',
    'Use incremental refresh and a lakehouse/warehouse layer instead of importing directly from source. Partition by date.',
    true, 40),
('Write-back planning', 'gotcha', 'all',
    '[{"questionKey": "write_back", "operator": "equals", "value": "yes"}]',
    'Write-back needs a planning database and user licences for every contributor. Check the Acterys licence count against the number of planners.',
    false, 50);
