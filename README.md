# Myalo (Next.js) + Supabase

Campus care: time-bounded therapy programmes and peer groups. Sessions use Google Meet — Myalo does not run its own video stack.

## 1. Create a Supabase project

1. New project at [supabase.com](https://supabase.com)
2. SQL editor → run `supabase/migrations/20260813_init.sql`
3. Copy the **service role** key into `SUPABASE_SERVICE_ROLE_KEY` on Vercel (and locally). With it, signup auto-confirms accounts and never sends a verification email.
4. If the service role key is missing, signup falls back to the browser — then you must turn **Confirm email** off under Authentication → Providers → Email, or Create account will fail.
5. Optional URL settings (only needed if you re-enable confirm emails later):

   - **Site URL** = `https://myola-health.vercel.app`
   - **Redirect URLs** include `https://myola-health.vercel.app/**`

Copy `.env.example` to `.env.local` for local work:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=
```

On **Vercel**, set `NEXT_PUBLIC_SITE_URL` to `https://myola-health.vercel.app` and set `SUPABASE_SERVICE_ROLE_KEY`. Redeploy after changing env vars.

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
