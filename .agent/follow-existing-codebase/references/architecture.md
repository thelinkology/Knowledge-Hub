# Codebase Architecture Reference

Detailed reference for **Knowledge Hub**. Read [SKILL.md](../SKILL.md) first for the rules; this file explains
*where things are and how they connect*. Paths are relative to `src/` unless stated otherwise.

---

## 1. Domain in one picture

```
Product (Acterys, BPP, Fabric…) ──┐ milestone templates
                                  ▼
Client ──┬── Articles (in Collections, versioned) ──┐
         ├── Library assets (scripts, flows, ref. architectures, demo assets…) ──┤ linked by IF/ELSE rules
         └── Discovery intakes ── answers ──► evaluateRules ──► matched gotchas / best practices
                                   │
                                   └──► generateBrds ──► Customer BRD  +  Internal delivery brief
Shared knowledge = client_id null.        Published articles/assets ──► /api/v1 ──► Copilot Studio agent
```

---

## 2. Request lifecycle

```
app/(portal)/x/page.tsx (server) ─► server/actions/* (first load + requirePagePermission)
  └─ <XSWRProvider fallbackData> ─► useSWRX() (services/x) ─► api.fetchJson ─► app/api/x/route.ts
                                                                  └─ apiAuthHandler(permission) → zod → server/actions/x
       └─ useSyncResource → store (stores/*) → components read with selectors
Agent:  Copilot Studio ─► app/api/v1/* ─► agentHandler (API key, rate limit) ─► server/actions/integrations/agent.ts
```

---

## 3. Data model (`supabase/migrations`)

| Migration | Contents |
|---|---|
| `20261105000100_foundation.sql` | Enums, every table, RLS policies, `handle_new_user`, `hit_rate_limit`, `save_article`, `search_knowledge`, `knowledge-media` bucket |
| `20261105000200_reference_data.sql` | Products (+ milestone templates), starter intake questions, example IF/ELSE rules |
| `20261106000100_knowledge_tree_diagrams.sql` | `articles.parent_id` (sub-articles), `products.logo_url`, `library_assets.diagram`, asset kinds without 'flow' |
| `20261106000200_article_tree_checks_at_commit.sql` | Tree checks (same collection, no cycle, ≤ 5 levels) run as a deferred constraint trigger; no collection ⇒ no parent |
| `20261106000300_diagram_components.sql` | `diagram_components` (architecture diagram component types), seeded with the 12 built-in types |

| Table | Notes |
|---|---|
| `profiles` | role `viewer` / `editor` / `admin`; created by `handle_new_user` (always viewer) |
| `products` | code, name, theme (ProductThemeOptions), `logo_url`, `milestone_template` jsonb |
| `clients` | slug, status, `product_ids`, owner |
| `collections` | ordered groups of articles; `client_id` null = shared |
| `articles` | `parent_id` (sub-articles within the collection, ordered by `position`), kind, audience (internal/customer), Markdown body, tags, status, `version`, generated `search` tsvector |
| `article_revisions` | snapshot per saved version (written by `save_article`) |
| `library_assets` | kind, `diagram` jsonb (reference architectures: views of nodes, edges, notes — @types/library/Diagram.ts; a node's `kind` = a `diagram_components` code), Markdown body, `url` (https), `code` + language, status, `search` tsvector |
| `diagram_components` | code (fixed), name, description, colour key, icon key, `image_url`, position; read by any signed-in user, written by the server only. Deleting a type leaves diagrams untouched: its nodes show a generic “Component” look |
| `knowledge_media` | uploaded images (private bucket, served by `/api/media/[id]`) |
| `intake_questions` | key, section, type, options, required, product scope, position, active |
| `intake_rules` | kind gotcha/best_practice, match all/any, conditions jsonb, guidance, show_to_customer, linked article/asset ids |
| `intakes` | client, products in scope, `answers` jsonb, notes, status |
| `brds` | client, intake, audience, status draft/final, body, milestones jsonb |
| `api_keys` | sha256 `key_hash`, prefix, optional client scope, revoked/last used — server-only (no RLS read) |
| `audit_events`, `rate_limit_hits` | ops |

RLS: viewers read published collections/articles/assets, clients, products, questions; editors also read drafts,
revisions, rules, intakes, BRDs; admins read the audit log. No browser-role writes anywhere.

| SQL function | What |
|---|---|
| `save_article(id, fields, saved_by, expected_version)` | Update + revision snapshot in one transaction; `ARTICLE_CHANGED` on a stale version |
| `search_knowledge(q, client, product, types, include_drafts, limit)` | Ranked FTS over articles + assets with `ts_headline` snippets; client scope = that client + shared |
| `hit_rate_limit(key, window, max)` | Fixed-window counter |

---

## 4. Server layer

| Folder | Main exports |
|---|---|
| `actions/auth` | `getCurrentUser`, `requireUser`, `assertPermission`, `requirePagePermission`, sign in/up/out, password reset (`SIGNUP_EMAIL_DOMAINS`) |
| `actions/users` | `getUsers`, `getPeople`, `setUserRole`, `inviteUser`, `deleteUserAccount`, `getMyProfile`, `updateProfile` |
| `actions/products` | `getProducts` (cached), `createProduct`, `updateProduct`, `knownProductIds`, `parseMilestones` |
| `actions/clients` | `getClients`, `getClientOptions`, `getClient(id, viewer)`, `createClient`, `updateClient`, `deleteClient`, `assertClientExists` |
| `actions/knowledge` | collections CRUD + `arrangeCollection` (sub-article tree); `getArticles`, `getArticleView`, `getArticleEditor`, `createArticle`, `saveArticle`, `setArticleStatus`, `deleteArticle`, revisions + restore; `searchKnowledge` |
| `actions/library` | `getAssets`, `getAsset`, `getAssetEditor`, `createAsset`, `saveAsset`, `deleteAsset` |
| `actions/diagramComponents` | `getDiagramComponents` (cached), `createDiagramComponent`, `updateDiagramComponent`, `deleteDiagramComponent` (knowledge.manage, audited) |
| `actions/intake` | questions + rules admin CRUD (with key/usage safeguards), `getIntakes`, `getIntakeEditor`, `createIntake`, `saveIntake`, `deleteIntake` |
| `actions/brds` | `getBrds`, `getBrd`, `generateBrds` (draft overwrite, finals kept), `saveBrd`, `deleteBrd` |
| `actions/integrations` | `createApiKey`, `listApiKeys`, `revokeApiKey`; `agent.ts`: `agentSearch`, `agentGetArticle`, `agentGetAsset`, `agentListClients` |
| `actions/reports` | `getHomeOverview` |
| `actions/media` | image library, prepare/confirm upload (byte check), `getMediaViewUrl` |
| `actions/audit`, `actions/theme` | `recordAudit`, `getAuditEvents`; theme cookie |
| `security/` | `rateLimit.ts` (`enforceRateLimit`, `LIMITS`), `agentAuth.ts` (`authenticateAgent`) |
| `routes/api/` | `apiHandler`, `apiAuthHandler`, `agentHandler`, `readJsonBody`, `readId`, `readQuery` |
| `integrations/openapi.ts` | Swagger 2.0 document for Copilot Studio |

---

## 5. Pure logic (`utils/`, unit-tested)

| File | Purpose |
|---|---|
| `lessonDoc.ts` | TipTap document ⇄ Markdown for every editor feature (round-trip tested) |
| `markdownEditing.ts`, `media.ts` | Markdown toolbar edits; videos (YouTube/Vimeo), images, callouts, reading stats |
| `articleValidation.ts` | `getPublishIssues`, `getOutline` (“In this article”: Heading/Subheading = ##/###), `headingId` (same ids as `shared/markdown/rehypeHeadingIds`) |
| `articleTree.ts` | Sub-article tree: `buildTree`, `flattenTree`, `outlineNumbers` (1, 1.1, 1.2…), `ancestorsOf`, `filterTree`, moves (`moveUp`/`moveDown`/`indent`/`outdent`), `validateArrangement` |
| `diagram.ts` | build sequence, diagram editing helpers, `componentResolver`, `diagramToMarkdown` (Download brief + agent API), export helpers (`pdfText`, `exportImageSize`, `markdownToPlainText`), GL planning starter template |
| `intakeRules.ts` | `evaluateRules`, `evaluateCondition`, `visibleQuestions`, `groupBySection`, `missingRequired`, `formatAnswer` |
| `intakeRuleEditing.ts` | operators per question type, readable "IF … THEN" text, answer clean-up |
| `brd.ts` | `buildBrd(input, audience)`, `buildMilestones`, `composeBrdMarkdown` (customer BRD never contains gotchas, internal articles or notes) |
| `apiKeys.ts` | key format, header parsing, `absolutizeMarkdownLinks` |
| `tags.ts`, `slugs.ts`, `ids.ts`, `emailDomains.ts`, `dates.ts`, `fileTypes.ts`, `errors.ts`, `parse.ts` | plumbing |

---

## 6. Client layer

| Services (`services/`) | Stores (`stores/`) |
|---|---|
| `knowledge` (articles, collections, revisions, search), `library`, `clients` (+ products, people), `intake`, `brds`, `integrations`, `home`, `media` (`uploadImage`), `users`, `misc` (auth) | `AppStores` (products, article editor/view, collection, clients, home), `LibraryStores` (+ `useDiagramComponentsStore`), `IntakeStores`, `BrdStores`, `SettingsStores` (products admin, API keys), `AdminStores` (users, audit), `NavSectionsStore` (collapsed side-nav sections), `KnowledgeTocStore` |

| Components | Contents |
|---|---|
| `ui/` | Ecme primitives |
| `shared/` | `editor/MarkdownBodyEditor` (+ visual TipTap editor, Markdown toolbar, image/video dialogs), `MarkdownContent` (+ `markdown/` remark/rehype plugins), `DocumentOutline` (“In this article”), `ProductLogo`, `PublishChecklist`, `KnowledgeTags`, `MilestonesEditor`, `PageHeader`, `EmptyState`, `ErrorState`, `Loading`, `ConfirmDialog`, `StatTile` |
| `template/` | App shell: side nav (collapsible sections), header search (→ `/knowledge?q=`), user menu, theme toggle |
| `knowledge/` | `browse/` (search, filters, product cards with images, collections, new article/collection), `collection/` (CollectionTree: outline-numbered, collapsed until opened), `reader/` (ArticleReader + ArticleToc: Learn-style tree with filter, In this section, outline), `editor/` |
| `library/` | browse, reader (code snippet with copy, AssetDiagram), editor (+ `editor/diagram/`: palette, inspector, notes, `DiagramComponentsDialog`), `diagram/` (React Flow canvas, loaded client-only; `DiagramDownloadMenu` + `downloadDiagram`: PNG / JPG / PDF via html-to-image and jsPDF, loaded on demand) |
| `clients/` | list, detail (overview/edit/delete), `tabs/` (knowledge, library, intakes, BRDs) |
| `intakes/` | list, new intake, `editor/` (questions by section, live guidance panel, generate BRDs) |
| `brds/` | list, document view (print/download/copy), editor (body + milestones, regenerate) |
| `admin/` | users, audit, products, intake (questions + rules), integrations (API keys + Copilot setup guide) |
| `home/` | home overview |

### Pages (`app/(portal)`)
`/` home · `/knowledge` · `/knowledge/collections/[id]` · `/knowledge/articles/[id]` (+ `/edit`) · `/library` ·
`/library/[id]` (+ `/edit`) · `/clients` · `/clients/[id]?tab=` · `/intakes` · `/intakes/[id]` · `/brds` ·
`/brds/[id]` (+ `/edit`) · `/profile` · `/admin/users` · `/admin/products` · `/admin/intake` · `/admin/integrations` ·
`/admin/audit`. Public: `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/privacy`.

---

## 7. Styling

```
assets/styles/
├── app.css         manifest
├── tailwind/       _tokens.css (colour variables, light + .dark), _base.css
├── components/     Ecme primitive styles (don't fork; extend via tokens)
├── template/       Ecme shell styles
├── knowledge/      _diagram.css (component colours `.diagram-color-*`, canvas, export overrides), _content.css (reader + editor: figures, callouts, video facade, editor tables),
│                   _products.css (product themes, print rules)
├── vendors/        simplebar
└── others/         _animations.css (reduced-motion aware)
```

---

## 8. Testing & verification

```bash
npm test              # vitest: src/**/*.test.ts + tests/db/*.test.ts (PGlite runs every migration)
npm run typecheck
npm run lint
npm run format:check
npm run db:types      # after changing a migration
npm run build
```

`tests/db/testDb.ts` shims Supabase (`auth.users`, `auth.uid()`, roles) and offers `createUser`, `asUser`,
`createClient`, `createArticle`, `createAsset`, `productId`. `tests/db/foundation.test.ts` covers the sign-up
trigger, RLS, `save_article` versioning and `search_knowledge` scoping.
