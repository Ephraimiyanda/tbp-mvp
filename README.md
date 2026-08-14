# Myalo (Next.js) + Supabase

Campus care: time-bounded therapy programmes and peer groups. Sessions use Google Meet — Myalo does not run its own video stack.

## 1. Create a Supabase project

1. New project at [supabase.com](https://supabase.com)
2. SQL editor → run `supabase/migrations/20260813_init.sql`
3. Copy the **service role** key into `SUPABASE_SERVICE_ROLE_KEY` on Vercel (and locally). With it, signup auto-confirms accounts and never sends a verification email.
4. If the service role key is missing, signup falls back to the browser — then turn **Confirm email** **off** under Authentication → Providers → Email, or Create account will fail.
5. Optional URL settings (Site URL / Redirect URLs) only matter if you re-enable confirm emails later. Production origin: `https://myola-health.vercel.app`.

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

3. **Meet links (no cron)**

Hobby Vercel cannot run frequent crons, so Myalo does not use a scheduler. When the student or professional taps **Open Session** at session time, `/api/sessions/[id]/join` checks the clock and either opens in-app chat or releases the stored Meet URL. Until then the link stays hidden in `session_meet_links`.

## 4. Demo seed (live mock professionals + communities)

With `SUPABASE_SERVICE_ROLE_KEY` set:

```bash
npm run seed:demo
```

Or `POST /api/demo/seed`. Creates three professionals, three matched students with Care Loop plans, nuggets, and three peer communities. Password for every demo account: `DemoPass123!`.

| Role | Name | Email | Care Loop |
|---|---|---|---|
| Professional | Ada Okonkwo | `ada.okonkwo@myalo.demo` | Amara’s exam-season plan |
| Professional | Chidi Mensah | `chidi.mensah@myalo.demo` | Tunde’s small-wins plan |
| Professional | Zainab Adeyemi | `zainab.ade@myalo.demo` | Kemi’s pace-and-boundary plan |
| Student | Amara Bello | `amara.bello@myalo.demo` | 3/5 done, one “I’m stuck” flag |
| Student | Tunde Okafor | `tunde.okafor@myalo.demo` | Video match, 2/4 done |
| Student | Kemi Adewale | `kemi.adewale@myalo.demo` | 1/4 done, boundary assist flag |

The seed is idempotent. It also attaches a mock plan to any other active student (so a live subscribed account can demo immediately). Each pair has a completed session with a published plan plus an **Open Session** slot that is already unlocked.

Also run `supabase/migrations/20260814_demo_sessions_pay.sql` in the SQL editor for chat sessions and mock payments.

Also run `supabase/migrations/20260815_fix_rls_helpers.sql` so helper functions are `SECURITY DEFINER` (fixes stack-depth errors when loading professionals with names or group members).

Also run `supabase/migrations/20260816_care_loop.sql` for Care Loop (between-session exercise plans, chat vs video per match, and AI-assist flags).

## Product

See [docs/MYALO.md](./docs/MYALO.md).
