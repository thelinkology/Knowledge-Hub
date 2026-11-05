# Auth email templates

Branded, plain-language versions of the emails Supabase sends. Their links use `token_hash`, so they
work on **any device**. (Supabase's default links only work in the browser that started the sign-up.)

## Install (once per Supabase project)

1. **Authentication → URL Configuration**
    - **Site URL:** your app's address, e.g. `https://your-app.vercel.app`. The templates build their
      links from it. For local-only testing, use `http://localhost:3000`.
    - **Redirect URLs:** add `http://localhost:3000/**` and `https://your-app.vercel.app/**`.
2. **Authentication → Emails → Templates.** For each template, paste the file's contents and set the
   subject:

| Template | File | Subject |
|---|---|---|
| Confirm signup | `confirmation.html` | Confirm your Knowledge Hub account |
| Reset password | `recovery.html` | Reset your Knowledge Hub password |
| Change email address | `email_change.html` | Confirm your new email for Knowledge Hub |

3. **Optional, recommended:** set up custom SMTP under **Authentication → Emails → SMTP
   Settings**. Supabase's built-in sender is rate-limited to a few emails per hour, which a team signing
   up at once will hit. Reliable delivery needs your company mail service or a provider such as Resend,
   Postmark or SendGrid.

## How the links work

Each link goes to `/auth/confirm?token_hash=…&type=…&next=…`. That route
(`src/app/auth/confirm/route.ts`) verifies the token, which signs the person in, then sends them to
`next`:

- the dashboard with a welcome message, after confirming
- `/reset-password`, after a reset link

Expired or used links land on a friendly page offering a new one.

The wording on the app's own screens lives in `src/configs/authMessages.config.ts`. Keep both in the
same tone.
