---
name: follow-existing-codebase
description: >-
  Follow the Knowledge Hub (client knowledge management: Next.js 16 App Router + Supabase + Vercel, Ecme UI)
  architecture, coding style, component patterns, security model and design system when implementing new
  features, pages, components, API routes, server actions, SQL migrations or agent (Copilot Studio) endpoints.
  Activate this skill for any development task that adds or modifies code in the repository. It ensures
  consistency, maximum reuse, server-side trust, and that new code looks like a natural extension of the
  existing codebase.
---

# Follow Existing Codebase — Knowledge Hub

> **Core Principle:** Before creating anything new, search for something that already exists.
> Reuse it if possible. If it cannot be reused directly, extend or compose it. Only create
> something new when there is a clear reason.

> **Trust Principle:** The browser is never trusted. Permissions, publishing rules, BRD generation and what an
> agent may read are decided on the server; the database enforces read scoping with RLS.

Knowledge Hub is a Microsoft Learn-style knowledge base for a delivery team where **everything connects to a
client**: knowledge articles (grouped in collections), a library of reusable assets (scripts, flows, reference
architectures, demo assets), discovery intakes with IF/ELSE rules (gotchas, best practices), and generated
customer-facing and internal BRDs. Published knowledge is exposed read-only to a Copilot Studio agent through
`/api/v1` with API keys. For the detailed map read [architecture.md](./references/architecture.md).

---

## Decision Hierarchy

1. **Reuse** an existing component, hook, utility, service, store, server action or SQL function
2. **Extend** an existing one in a backward-compatible way
3. **Compose** existing pieces into a new feature component
4. **Create** a new reusable component (in `ui/` or `shared/` if others will need it)
5. **Create** page-specific implementation (last resort)

Never jump directly to step 5.

---

## Before Writing Any Code

### Step 1 — Understand the request
Page, component, API route, server action, store, SQL migration, agent endpoint, or fix? Which role(s) use it
(viewer / editor / admin) and which permission guards it?

### Step 2 — Search the codebase, in this order
1. `src/components/ui/` — Ecme design-system primitives (Button, Card, Table, Tabs, Form, Select, Dialog, Segment…)
2. `src/components/shared/` — app composites (ConfirmDialog, EmptyState, ErrorState, Loading, PageHeader, StatTile,
   MarkdownContent, PublishChecklist, KnowledgeTags, **editor/MarkdownBodyEditor**)
3. `src/components/<feature>/` — `knowledge/`, `library/`, `clients/`, `intakes/`, `brds/`, `admin/`, `home/`
4. `src/services/<entity>/` — browser API functions + SWR hooks
5. `src/stores/` — Zustand stores (`AppStores.ts` and per-feature `*Stores.ts`, `createResourceStore.ts`)
6. `src/@types/<entity>/` — interfaces, zod schemas, option maps
7. `src/server/actions/<entity>/` — business logic; `src/server/data/supabase/` — clients + error mapping
8. `supabase/migrations/` — schema, RLS, SQL functions
9. `src/utils/` (pure, shared client+server, unit-tested), `src/utils/hooks/`, `src/constants/`, `src/configs/`
10. Grep for a similar feature and copy its shape (the **article editor** is the reference slice)

### Step 3 — Produce a short plan

| Section | Content |
|---|---|
| **Existing pieces to reuse** | Components, hooks, utils, services, stores, actions, SQL functions |
| **New pieces required** | Only those that genuinely need creating |
| **Files to modify** | Expected file list |
| **Security** | Permission, RLS impact, what the server must decide |
| **Architecture fit** | Which layer each change lives in and why |

---

## Project Stack

| Aspect | Value |
|---|---|
| Framework | Next.js 16 (App Router, `src/proxy.ts`), React 19.2, deployed on **Vercel** |
| TypeScript | 5.9 (strict), path alias `@/*` → `src/*` |
| Backend | **Supabase**: Postgres (RLS on every table, full-text search) + Auth (email/password, `@supabase/ssr` cookies) + Storage |
| Styling | Tailwind CSS 4 + CSS-variable tokens (`src/assets/styles`), Ecme template, light-first |
| Client state | Zustand 5, fed by SWR 2 (SWR → Zustand bridge via `useSyncResource`) |
| HTTP (browser) | axios + axios-retry, only through `src/services/api.ts` |
| Forms | react-hook-form 7 + zod 3 + @hookform/resolvers |
| Content | Markdown everywhere. Editing: TipTap visual editor ⇄ Markdown (`utils/lessonDoc.ts`). Reading: `shared/MarkdownContent` (raw HTML never rendered) |
| Icons | react-icons (Tabler) via semantic names in `src/configs/icons.config.tsx` |
| Dates | dayjs (`src/utils/dates.ts`) |
| Tests | Vitest: pure logic (`src/utils/*.test.ts`) + SQL in PGlite (`tests/db/*.test.ts`) |
| Lint / format | ESLint flat config (next core-web-vitals + typescript + prettier); Prettier: single quotes, no semicolons, 4 spaces, width 120 |

Roles: `viewer`, `editor`, `admin` (`profiles.role`, set only by admins; sign-ups are viewers). Permissions in
`@types/auth/Roles.ts`: `knowledge.read`, `knowledge.manage`, `clients.manage`, `requirements.manage`,
`settings.manage`, `users.manage`, `audit.view`. API routes use `apiAuthHandler(permission, …)`; pages use
`requirePagePermission(permission)`; the UI hides actions with `useSession().can(permission)` (presentation only).

---

## Security Model (non-negotiable)

1. **The browser never talks to Supabase** (except uploading to a signed URL the server just issued). It calls
   `/api/*` routes; Supabase keys are server-only env vars (no `NEXT_PUBLIC_`).
2. **Every route authorises** with `apiAuthHandler(permission | null, …)` (401/403). Viewers get **404** (not 403)
   for unpublished items, so drafts can't be probed.
3. **Reads** that RLS can scope may use `createUserClient()`; **writes** use `supabaseAdmin()` *after*
   authorisation. RLS still denies all browser-role writes and scopes reads (defense in depth).
4. **Multi-row or versioned writes go in SQL functions** (`SECURITY DEFINER`, `EXECUTE` granted to `service_role`
   only), e.g. `save_article` (save + revision snapshot + optimistic version check), `search_knowledge`.
5. **Decide in TypeScript, apply in SQL/Supabase.** Pure functions (`utils/articleValidation.ts`,
   `utils/intakeRules.ts`, `utils/brd.ts`) decide; the server applies them. Publishing rules run on the server
   even though the UI shows the same checklist.
6. **Agents (Copilot Studio) only read published content** through `/api/v1/*` with an API key
   (`Authorization: Bearer kh_…` or `x-api-key`). Only the key's SHA-256 is stored; keys can be scoped to a client
   and revoked; every request is rate-limited per key. Agent responses contain Markdown, never raw HTML.
7. **Roles never come from user input** (sign-up metadata is ignored by `handle_new_user`).
8. **Audit** consequential changes with `recordAudit()` (roles, invites, publishing, deletions, BRD generation, keys).
9. **Uploads** never pass through our functions (Vercel's 4.5 MB body limit): the server issues a one-time signed
   upload URL for a path it chooses, then reads the stored bytes back and checks them (`checkImageUpload`)
   before keeping the file. Images are served via `/api/media/[id]` (signed in → short-lived signed URL).
10. **Abuse-prone routes are rate-limited** with `enforceRateLimit` (database-backed, hashed keys, fail-open).
    Unexpected errors go through `reportError`. New outside origins must be added to the CSP in `next.config.ts`.
11. Client data is business-confidential: never send it to third parties; never log bodies of articles/intakes.

---

## Folder Structure Rules

```
supabase/migrations/   → Ordered SQL: schema + RLS + functions, reference data
scripts/               → generate-db-types.mjs (PGlite → src/@types/supabase/database.types.ts)
tests/db/              → PGlite tests for SQL functions and RLS (testDb.ts shims Supabase's auth schema)
src/
├── @types/            → Types, zod schemas, *Options maps, one folder per entity; supabase/database.types.ts (generated)
├── app/
│   ├── layout.tsx     → html/body, fonts, theme cookie, ThemeProvider, SWRAppConfig
│   ├── (auth)/        → login, signup, password reset (public)
│   ├── (portal)/      → app shell (PostLoginLayout); page.tsx files are server components
│   ├── api/<route>/route.ts → validate (zod) → server action → response
│   ├── api/v1/        → the agent API (API-key auth, published content only)
│   └── auth/confirm/  → email confirmation callback
├── assets/styles/     → ALL CSS (app.css manifest; tailwind/, components/, template/, knowledge/, others/)
├── components/
│   ├── ui/ shared/ template/ auth/ swr/
│   └── <feature>/     → kebab/camel feature dirs with dialogs/, editor/, reader/, forms/
├── configs/           → app.config (every path), navigation.config, icons.config, swr.config, theme
├── constants/         → *.constant.ts
├── server/            → SERVER-ONLY (every file starts with `import 'server-only'`)
│   ├── actions/<entity>/  → business logic (+ mappers.ts for row → app type)
│   ├── data/supabase/     → config, server (user client), admin (service role), errors, storage, json
│   ├── routes/api/        → apiHandler, apiAuthHandler, readJsonBody, readId, readQuery
│   └── utils/             → response.ts, errors.ts
├── services/<entity>/ → browser API functions + SWR hooks
├── stores/            → Zustand stores
├── utils/             → pure utilities (+ *.test.ts); hooks/; hoc/
└── proxy.ts           → session refresh + optimistic redirect to /login
```

### File naming

| Type | Convention | Example |
|---|---|---|
| Components | PascalCase `.tsx`, default export | `ArticleReader.tsx` |
| Client pages | `<Entity>ClientPage.tsx` | `ArticleEditorClientPage.tsx` |
| SWR providers | `<Entity>SWRProvider` | `ArticleEditorSWRProvider` |
| Services | `services/<entity>/index.ts` | `services/knowledge/index.ts` |
| Server actions | `server/actions/<entity>/index.ts` | `server/actions/knowledge/index.ts` |
| Request schemas | `@types/<entity>/<Entity>.ts` (interfaces + zod together) | `@types/knowledge/Article.ts` |
| Form schemas | `@types/<entity>/forms/*FormData.ts` | `ArticleFormData.ts` |
| Migrations | `YYYYMMDDHHMMSS_description.sql` | `20261105000100_foundation.sql` |
| Pure logic + tests | `utils/<name>.ts` + `utils/<name>.test.ts` | `intakeRules.ts`, `intakeRules.test.ts` |

---

## Component Patterns

- Props are interfaces (`[Component]Props`) or inline for tiny components; destructured in the signature
- `className` accepted and merged with `classNames()` (`classnames` + `tailwind-merge`)
- `'use client'` only where hooks/handlers/browser APIs are used
- Pages are **server components**: `requirePagePermission`, validate ids (`isUuid`), server-fetch to avoid a
  loading flash (`notFound()` via `isNotFound(error)`), then render `*SWRProvider` + `*ClientPage`
- React 19: `ref` is a prop; ids from `useId`; no `Date.now()`/`Math.random()` in render
- Imports always `@/…`; `import { type X }` for types; no barrels except `ui/*/index`
- Plain **Card**s, tables and Microsoft Learn-style reading layouts. Content stays calm and readable.

### The editor (reuse it — don't build another)
`components/shared/editor/MarkdownBodyEditor` is the one content editor: visual (TipTap) / Markdown /
side-by-side / preview, image upload (paste/drop/library/link), YouTube/Vimeo, callouts, tables, full screen.
Use it inside a react-hook-form `FormProvider` with `name="<field>"`. New block types must be added to
`utils/lessonDoc.ts` (both directions + a test) before the editor offers them.

---

## Critical Architecture Pattern: SWR → Zustand Bridge

```
[page.tsx (server)] ─► [XSWRProvider] ─► useSWRX() (services/) ─► api.fetchJson ─► /api/x ─► server action ─► Supabase
                              │ useSyncResource(swr, setters)
                              ▼
                       [Zustand store]  ─►  leaf components read with selectors
```

- Stores: `createResourceStore<T>()` (single) / `createKeyedResourceStore<T>()` (per id) in
  `stores/createResourceStore.ts`
- A provider calls the hook and `useSyncResource(swr, { setData, setLoading, setError, setRefresh })`
- After a mutation: call the store's `refresh()` (or `setData` with the server's response)
- Exception: page-local lists no other component shares (a filtered table) may read SWR directly

---

## Server Patterns

### API route
```ts
export const PUT = apiAuthHandler<{ articleId: string }>('knowledge.manage', async (req, ctx, user) => {
    const articleId = readId((await ctx.params).articleId, 'article')
    return getJsonResponse(await saveArticle(user, articleId, SaveArticleSchema.parse(await readJsonBody(req))))
})
```
Routes stay thin. Writes from other origins are blocked by `apiHandler` (Origin check).

### Server actions and data
- `unwrap(result, 'load the client')` for queries that must return data; `unwrapMaybe` for `.maybeSingle()`;
  `check(result, 'save …')` for writes; `toAppError` for RPC errors. The context string completes "Couldn’t …"
- SQL `raise exception 'CODE'` → typed errors in `KNOWN_ERRORS` (`server/data/supabase/errors.ts`)
- Map rows → app types in `mappers.ts` (camelCase, `Date`s); the browser never sees raw rows
- Embedded selects with two FKs to the same table name the FK: `creator:profiles!articles_created_by_fkey(display_name)`
- Typed errors from `@/@types/errors`: `DataError` 400, `UnauthorizedError` 401, `ForbiddenError` 403,
  `NotFoundError` 404, `ConflictError` 409, `TooManyRequestsError` 429, `ServiceUnavailableError` 503

### Database changes
1. Add a new migration (never edit an applied one); enable RLS + read policies; `revoke … from anon, authenticated`
2. `npm run db:types` to regenerate `src/@types/supabase/database.types.ts`
3. Add/extend PGlite tests in `tests/db/`

---

## Form Patterns

```tsx
const form = useForm<ClientInput>({ resolver: zodResolver(ClientSchema), defaultValues })
<FormProvider {...form}>
    <Form id={FORM_ID} onSubmit={form.handleSubmit(onValid)} noValidate>
        <FormItem label="Name" htmlFor="client-name" invalid={!!errors.name} errorMessage={errors.name?.message}>
            <Controller name="name" control={control} render={({ field }) => <Input id="client-name" {...field} />} />
        </FormItem>
    </Form>
</FormProvider>
```
- Request schemas are reused by the route **and** typed into the service
- Dialog forms: `ConfirmDialog confirmForm={FORM_ID}`; the server validates again — form schemas are UX
- Pickers hold `''` for "none" in the form and become `null` in the request

---

## Styling Rules

- CSS only in `src/assets/styles/` (manifest `app.css`); otherwise Tailwind classes
- Tokens, never hex in components: `primary` (Fluent blue), `gray-50…950`, `error`/`success`/`warning`/`info` (+ `-subtle`)
- Product colours: `product-theme-*` + `product-tag` / `product-accent` (`knowledge/_products.css`, via `ProductTag`)
- Always add `dark:` variants; light is the default theme, dark must stay accessible
- Radius: `rounded-lg` small, `rounded-xl` controls, `rounded-2xl` cards/panels/dialogs
- Icons only from `@/configs/icons.config` (semantic names; nav keys in the default map)
- Printing: add `no-print` to chrome; BRDs and articles must print cleanly (Print / Save as PDF)

---

## UX Conventions

- Every async action shows progress (`loading`) and ends in a toast (`toastSuccess` / `toastError(msg, error)`)
- Errors say what happened **and what to do next**; empty states explain why and offer the next step
- Destructive actions use `ConfirmDialog` (`warning`/`danger`) and say what can't be undone
- Editors: Ctrl/Cmd+S saves, unsaved-changes guard, a publish checklist, version history where content is versioned
- Accessibility: native inputs, labels, `aria-*` on state, keyboard navigation, skip link, AA contrast
- Responsive: mobile first; tables scroll horizontally; layouts collapse to one column

---

## Quality Checklist

- [ ] **Reuse**: existing components, services, stores, actions, SQL functions
- [ ] **Layers**: page → provider → store → UI; route → action → Supabase
- [ ] **Security**: permission checked server-side; viewers can't see drafts; nothing trusted from the browser; RLS on new tables
- [ ] **Types**: from `@types/`; no `any`; request schemas shared by route and service; DB types regenerated
- [ ] **Tests**: pure logic in `src/utils/*.test.ts`; SQL/RLS in `tests/db/*.test.ts`
- [ ] **Styling**: tokens, `classNames()`, `dark:` variants, icons from `icons.config`
- [ ] **Verified**: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, and the change looked at in the browser

---

## Anti-Patterns (Do NOT Do)

- ❌ Call Supabase from the browser or expose keys with `NEXT_PUBLIC_`
- ❌ Return drafts to viewers or agents, or raw database rows to the browser
- ❌ Use `supabaseAdmin()` before authorising the user
- ❌ Store agent API keys in plain text, or accept them in query strings
- ❌ Build a second rich-text editor — use `shared/editor/MarkdownBodyEditor`
- ❌ Create a component/hook/util that already exists; add a library without a clear reason
- ❌ Call SWR directly in leaf components (use a `*SWRProvider` → store) except page-local lists
- ❌ Put business logic in `route.ts`; import `src/server/**` from client components
- ❌ Hard-code colours or URLs (use tokens and `configs/app.config`)
- ❌ Buttons that do nothing, placeholder features presented as working, or mock data in place of persistence
- ❌ Semicolons, double quotes, or files formatted differently from Prettier
