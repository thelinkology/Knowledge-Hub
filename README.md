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
| Viewer (default for new accounts) | Read published shared knowledge plus the knowledge of the clients an administrator assigns them to (Administration → Users & roles). No library or client pages |
| Editor | Write and publish knowledge and library assets, manage clients, run intakes and BRDs |
| Administrator | Everything, plus users & roles, products, intake questions and rules, Copilot API keys, audit log |

## Local setup

1. **Install**: Node 22+, then `npm install`.
2. **Create a Supabase project** (supabase.com → New project).
3. **Apply the migrations** in `supabase/migrations` in order — either paste each file into the Supabase SQL editor,
   or with the Supabase CLI: `supabase link --project-ref <ref>` then `supabase db push`.
4. **Environment**: copy `.env.example` to `.env.local` and fill in `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and
   `SUPABASE_SECRET_KEY` (Supabase → Project Settings → API). On Vercel, redeploy after changing an environment
   variable.
5. **Auth settings** (Supabase → Authentication → URL configuration): Site URL `http://localhost:3000` (later your
   Vercel URL) and add `<site>/auth/confirm` to the redirect URLs. Optional: paste the templates from
   `supabase/templates` into Authentication → Email templates (they link through `/auth/confirm` and work on any device).
   **Email:** Supabase's built-in email service only sends to members of your Supabase project (and a few emails an
   hour), so invitations and sign-in links to anyone else fail until you set up custom SMTP (Authentication →
   Emails → SMTP settings, e.g. Microsoft 365, Resend or SendGrid).
6. **Access is by invitation only** (there is no sign-up page). Turn off **Allow new users to sign up** in Supabase →
   Authentication → Sign In / Providers, so accounts can't be made around the app. Create the first account in
   Supabase → Authentication → Users → **Add user → Create new user** (tick *Auto Confirm User*), then make it an
   administrator in the SQL editor. After that, administrators add people in the app (Administration → Users →
   **Add someone**: an emailed invitation, or a password you set and share):

   ```sql
   update public.profiles set role = 'admin' where email = 'you@company.com';
   ```

7. **Optional sample data**: paste `supabase/seed/sample_data.sql` into the SQL editor and run it (after step 6, so
   you're the author). It adds demo clients, knowledge for every product, library assets with diagrams, intakes and
   BRDs; it's safe to run twice, and the end of the file has the statements that remove it.

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
- **Product card images** (Browse by product): Administration → Products → edit → Card image, or (administrators)
  the image button on the card itself · **app icon**: `public/icon.svg`
- **Architecture diagram components**: in the designer, Components → Manage (editors and admins: name, colour, icon
  or image). Colours in `src/assets/styles/knowledge/_diagram.css` + `src/@types/library/DiagramComponent.ts`; the
  starter template is `glPlanningStarterView()` in `src/utils/diagram.ts`

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
