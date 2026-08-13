# Myalo (Next.js) + Supabase

Campus care: time-bounded therapy programmes and peer groups. Sessions use Google Meet — Myalo does not run its own video stack.

## 1. Create a Supabase project

1. New project at [supabase.com](https://supabase.com)
2. SQL editor → run `supabase/migrations/20260813_init.sql`
3. Authentication → URL configuration. This is what fills `redirect_to` on the confirm-email link:

   - **Site URL** = `https://myola-health.vercel.app`  
     Do **not** leave this as `http://localhost:3000`. If Site URL is localhost, confirm links open localhost even when you signed up on Vercel.
   - **Redirect URLs** — add all of these (wildcards matter; a path without `/**` will not match):

     ```
     https://myola-health.vercel.app/login
     https://myola-health.vercel.app/**
     http://localhost:3000/**
     ```

4. Authentication → Providers → Email → turn **Confirm email** **on**.
5. Authentication → Email templates → **Confirm signup** must use `{{ .ConfirmationURL }}` (not `{{ .SiteURL }}`).
6. Sign up **again** after saving those settings. Confirm emails already sent still contain the old `redirect_to`.

Copy `.env.example` to `.env.local` for local work:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

On **Vercel**, set `NEXT_PUBLIC_SITE_URL` to `https://myola-health.vercel.app`. Do not paste localhost there. Redeploy after changing env vars. Confirm-email `redirect_to` is always `https://myola-health.vercel.app/login`.

Google keys are optional. Without them, professionals paste a Meet link when they schedule. The student still cannot see that link until session time.

## 2. Run the app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Sign up once as a **student** (start at `/signup` — questionnaire during onboarding, account last) and once as a **professional** (`/signup?role=professional`, different emails). Subscribe as the student, then schedule a session as the professional.

## 3. Meet links (no cron)

Hobby Vercel cannot run frequent crons, so Myalo does not use a scheduler. When the student or professional taps **Join Google Meet** at session time, `/api/sessions/[id]/join` checks the clock, releases the stored URL, and opens Meet. Until then the link stays hidden in `session_meet_links`.

## Product

See [docs/MYALO.md](./docs/MYALO.md).
