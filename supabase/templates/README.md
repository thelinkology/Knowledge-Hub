# Auth email templates

Branded, plain-language, light-theme versions of all six emails Supabase sends. Their links use `token_hash`, so they
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
| Confirm sign up (unused: no self sign-up) | `confirmation.html` | Confirm your Knowledge Hub account |
| Invite user | `invite.html` | You’re invited to Knowledge Hub |
| Magic link or OTP | `magic_link.html` | Your Knowledge Hub sign-in link |
| Change email address | `email_change.html` | Confirm your new email for Knowledge Hub |
| Reset password | `recovery.html` | Reset your Knowledge Hub password |
| Reauthentication | `reauthentication.html` | Your Knowledge Hub verification code |

3. **Optional, recommended:** set up custom SMTP under **Authentication → Emails → SMTP
   Settings**. Supabase's built-in sender is rate-limited to a few emails per hour, which a team signing
   up at once will hit. Reliable delivery needs your company mail service or a provider such as Resend,
   Postmark or SendGrid.

## How the links work

Each link goes to `/auth/confirm?token_hash=…&type=…&next=…`. That page shows one button; pressing it
posts to `/auth/confirm/verify` (`src/app/auth/confirm/verify/route.ts`), which verifies the token, signs
the person in, then sends them to `next`. Opening the link alone changes nothing, because mail scanners
such as Microsoft Defender Safe Links open every link before the person does and would otherwise use up
the one-time token (“That link has expired or was already used”). After pressing the button, people go to:

- the dashboard with a welcome message, after confirming
- `/reset-password`, after a reset link, and after accepting an invitation (to choose a password)
- the home page, after a sign-in link (“magic link”): sent from the sign-in page (“Email me a sign-in
  link”) or by an administrator (Administration → Users → the envelope button). Only existing accounts
  get one; it never creates an account.
- `/profile`, after confirming a new email address

The reauthentication email has a code instead of a link (Supabase sends it before sensitive changes
when “Secure password change” is on).

Expired or used links land on a friendly page offering a new one.

The wording on the app's own screens lives in `src/configs/authMessages.config.ts`. Keep both in the
same tone.
