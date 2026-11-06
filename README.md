# Knowledge Hub

A Microsoft Learn-style knowledge hub for the delivery team, where **everything connects to a client**:

- **Knowledge** — articles (concepts, how-tos, tutorials, reference, troubleshooting, best practices) grouped in
  ordered collections, written with the same visual/Markdown editor as the Awakening Academy course editor,
  with version history, publishing and full-text search.
- **Library** — sample scripts and flows (Acterys, BPP, Fabric…), reference architectures, demo assets,
  components and templates.
- **Clients** — each client's page gathers its knowledge, assets, discovery intakes and BRDs.
- **Requirements** — a configurable discovery intake with IF/ELSE rules (gotchas and best practices) that
  generates a **customer-facing BRD** (reference architecture, demo links, recommendations, milestones) and an
  **internal delivery brief** (learning materials, scripts, components, demo assets, milestones / deliverables /
  dependencies, risks).
- **Copilot Studio** — published knowledge is exposed read-only at `/api/v1` (API keys, OpenAPI 2.0 spec) so a
  Copilot Studio agent can search and read it.

Built with Next.js 16 (App Router), React 19, Supabase (Postgres + Auth + Storage), Tailwind 4 and the Ecme UI
components, deployed on Vercel. Conventions for contributors (human or AI) are in
[`.agent/follow-existing-codebase/SKILL.md`](.agent/follow-existing-codebase/SKILL.md).

## Roles

| Role | Can |
|---|---|
| Viewer (default for sign-ups) | Read published knowledge, the library and client pages |
| Editor | Write and publish knowledge and library assets, manage clients, run intakes and BRDs |
| Administrator | Everything, plus users & roles, products, intake questions and rules, Copilot API keys, audit log |

## Local setup

1. **Install**: Node 22+, then `npm install`.
2. **Create a Supabase project** (supabase.com → New project).
3. **Apply the migrations** in `supabase/migrations` in order — either paste each file into the Supabase SQL editor,
   or with the Supabase CLI: `supabase link --project-ref <ref>` then `supabase db push`.
4. **Environment**: copy `.env.example` to `.env.local` and fill in `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and
   `SUPABASE_SECRET_KEY` (Supabase → Project Settings → API). Optionally set `SIGNUP_EMAIL_DOMAINS` to your company
   domain so only company addresses can self-register.
5. **Auth settings** (Supabase → Authentication → URL configuration): Site URL `http://localhost:3000` (later your
   Vercel URL) and add `<site>/auth/confirm` to the redirect URLs. Optional: paste the templates from
   `supabase/templates` into Authentication → Email templates (they link through `/auth/confirm` and work on any device).
6. `npm run dev` → <http://localhost:3000>, sign up, then make yourself an administrator in the SQL editor:

   ```sql
   update public.profiles set role = 'admin' where email = 'you@company.com';
   ```

## Deploying to Vercel

1. Push the repository to GitHub and import it in Vercel (framework: Next.js; no build settings to change).
2. Add the same environment variables (Production and Preview).
3. Set the Supabase Site URL / redirect URLs to the Vercel domain (`https://<app>.vercel.app/auth/confirm`).

## Connecting a Copilot Studio agent

1. In the app: **Administration → Copilot integration → Create key** (optionally scoped to one client). Copy the key —
   it's shown once.
2. In Copilot Studio: open your agent → **Tools → Add a tool → New tool → REST API** (or create a Power Platform
   custom connector) and import `https://<your-app>/api/v1/openapi.json`.
3. Authentication: **API key**, header `x-api-key`, paste the key.
4. Give the agent instructions such as *“Use SearchKnowledge to find relevant articles, then GetArticle for the full
   content. Cite the article URL. If nothing relevant is found, say so.”* (the integration page has a copyable version).

Only **published** content is returned. Client-scoped keys see that client's knowledge plus shared knowledge.

| Endpoint | Purpose |
|---|---|
| `GET /api/v1/knowledge/search?q=…&client=…&product=…&type=article\|asset\|all` | Ranked search with snippets |
| `GET /api/v1/knowledge/articles/{id}` | Full article (Markdown) |
| `GET /api/v1/library/assets/{id}` | A library asset (usage notes, code, link) |
| `GET /api/v1/clients` | Clients the key can see |
| `GET /api/v1/openapi.json` | Swagger 2.0 spec for Copilot Studio / custom connectors |

## Customising

- **Name, paths**: `src/configs/app.config.ts` · **navigation**: `src/configs/navigation.config.ts`
- **Colours**: `src/assets/styles/tailwind/_tokens.css` + `src/configs/preset-theme-schema.config.ts`; product colours
  in `src/assets/styles/knowledge/_products.css` · **logo**: `src/components/template/Logo.tsx`
- **Products, intake questions and IF/ELSE rules**: in the app (Administration), seeded by
  `supabase/migrations/20261105000200_reference_data.sql`
- **BRD templates**: `src/utils/brd.ts` and base milestones in `src/configs/brd.config.ts`
- **Product logos** (Browse by product cards): Administration → Products → edit → upload a logo
- **Architecture diagram components** (kinds, colours): `src/@types/library/Diagram.ts` +
  `src/assets/styles/knowledge/_diagram.css`; the starter template is `glPlanningStarterView()` in `src/utils/diagram.ts`

## Development

```bash
npm run dev          # local server
npm test             # vitest: src/utils/*.test.ts + tests/db/*.test.ts (migrations run in PGlite)
npm run typecheck
npm run lint
npm run format:check
npm run db:types     # after changing a migration: regenerate src/@types/supabase/database.types.ts
npm run build
```

Never edit an applied migration — add a new one. Never commit `.env.local`.
