# Myalo — campus care MVP

Myalo is a campus wellbeing product with two jobs:

1. **Therapy with a timeline.** A student is matched to a professional, subscribes, and works through a programme whose length follows the presenting issue. Sessions happen on Google Meet. Intake, notes, and Meet links stay between the student and their professional.
2. **Peer groups.** Students or professionals can create communities, act as admins, and run check-ins so members can track growth with people who share an interest or background.

This is not a clone of another therapy marketplace. Myalo’s wedge is the peer layer plus time-bounded care, not an always-on consumer subscription brand.

---

## User loops

### Care (student ↔ professional)

```
Get started (questions, one screen at a time) → account at the end
        → matching animation → see the professional → subscribe
        → professional schedules sessions on a care-plan timeline
        → at session time Myalo releases a Google Meet link
        → student joins; professional may keep private notes
        → professional posts nuggets; subscribers see them
```

Matching is not auto-enrollment. After a proposed match the student must **subscribe** before any session is scheduled.

### Groups

```
Student or professional creates a group (they become admin)
        → students join (cap keeps rooms small)
        → members post check-ins (mood + note)
        → group home shows a simple growth trail
```

---

## What we do not build

- A custom video stack. Google Meet is the session room.
- Insurance billing, native apps, crisis clinical workflows, or ad-tech.
- Platform-admin access to intake answers or session notes.

---

## Confidentiality

- Intake and session notes: student + matched professional only. Never marketing.
- Google Meet URL: stored encrypted-at-rest by Postgres; **not shown to the student until `scheduled_at`**.
- Group display names may be a chosen name; legal identity stays on `profiles` for safety.
- Audit log records who read sensitive rows.

Mandated-reporting exception (imminent harm) is stated on the consent screen. Myalo is not emergency care.

---

## Care-plan lengths (starting rules)

| Primary concern | Weeks | Target sessions |
|---|---|---|
| Exam stress | 4 | 4 |
| Sleep | 6 | 6 |
| Homesickness | 6 | 6 |
| Anxiety / relationships / first-gen | 8 | 8 |
| Identity | 10 | 8 |
| Mood / grief | 12 | 10 |

The longest matching concern wins. Professionals can still pace sessions inside that window.

---

## Stack

| Layer | Choice |
|---|---|
| App | Next.js (App Router) |
| Auth + data | Supabase (Postgres, Auth, RLS) |
| Sessions | Google Calendar → Meet when credentials exist; otherwise the professional pastes a Meet link |
| Release | Student/professional tap Join; the API only returns the Meet URL once `scheduled_at` has passed. No Vercel cron (Hobby cannot run frequent jobs). |
| Payments | Subscription row now; Stripe can attach later |

---

## Roles

- **Student** — intake, match, subscribe, join Meet, join/create groups, read nuggets from professionals they subscribe to.
- **Professional** — profile, accept subscribers, schedule sessions, private notes, nuggets, create/admin groups.
