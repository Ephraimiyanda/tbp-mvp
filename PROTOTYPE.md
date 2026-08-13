# TBP — 1-day prototype plan

A clickable campus-wellbeing prototype, not a production product. Modeled on [BetterHelp `/next`](https://www.betterhelp.com/next/) (landing → short intake → match), adapted for undergraduates.

The original MVP plan (SSO, video, Stripe, peer groups, admin, ML matching) is a multi-week build. This prototype exists to prove one loop in a day: **a student can start, answer a few questions, get a counselor, and pretend to talk to them.**

---

## What BetterHelp `/next` actually is

`/next` is BetterHelp’s logged-out get-started surface. The pattern:

1. **Dark-green hero** — “You deserve to be happy.” plus three therapy-type CTAs (Individual / Couples / Teen).
2. **Proof strip** — session counts, therapist counts, member counts.
3. **How it works** — match → communicate your way → therapy when you need it.
4. **Comparison table** vs in-office therapy (messaging, video, easy switch).
5. **Reviews + FAQ**, then **Get started**.
6. **Questionnaire** (their real funnel is ~14 screens / 10–15 minutes). Gender, age, identity, reason, therapist style, communication mode, preferences, then paywall, then wait 24–48h for a match.

We copy the *shape and tone*, not the brand, not the 14-screen slog, and not the paywall.

---

## Prototype thesis

If a student can go from landing to a named counselor and a message thread in under two minutes, the product idea is demoable. Everything else is theater we skip.

---

## In scope (one sitting)

| Surface | What ships | BetterHelp analogue |
|---|---|---|
| Landing `/` | Hero, three support types, stats, how-it-works, comparison, reviews, FAQ, crisis footer | `/next` homepage |
| Intake `/get-started` | 8 screens, progress bar, back, campus-flavored questions | Get-started questionnaire, cut in half |
| Matching `/matching` | 2–3s “finding a counselor” then ranked pick | Algorithmic match (instant, not 48h) |
| Match card `/match` | Counselor bio, specialties, confirm or switch | First-match reveal |
| Home `/home` | Thread with counselor, book a fake slot, rematch, one peer-group teaser | Member area (messages + schedule) |
| Crisis intercept | If they mark crisis, show campus/hotline resources instead of matching | BetterHelp “not for emergency” FAQ, made visible |

**Stack:** Next.js (App Router) + TypeScript + Tailwind. Client-only. Seeded counselors. `localStorage` for the session. No database, no auth, no payments, no live video.

**Matching:** weighted rules against 6 seeded counselors (specialty overlap + hard preference filters). Good enough to feel personal; not ML.

---

## Intake (8 screens, ~90 seconds)

1. **Who you are** — Woman / Man / Non-binary / Prefer not to say. One-line “why we ask.”
2. **Year** — 100 / 200 / 300 / 400 / postgraduate. Campus stand-in for BetterHelp’s age dropdown.
3. **What’s going on** — multi-select: exam stress, anxiety, low mood, homesickness, relationships, identity, grief, sleep, first-gen pressure. Last option: *I’m in crisis right now* → resource screen, stop the funnel.
4. **Been in counseling before?** — Yes / No / Not sure.
5. **What you want from a counselor** — listens / teaches skills / challenges me / gentle vs direct.
6. **How you want to talk** — mostly messaging / mostly video / mix.
7. **Counselor preferences (optional)** — gender, LGBTQ+ affirming, faith-sensitive. Skip allowed.
8. **Name + school email + consent** — plain-language confidentiality (what is private, what isn’t: imminent harm). No password, no card.

Then a short matching animation → counselor card → Confirm → `/home`.

Peer-support CTA from the landing skips counselor matching and lands on a single suggested group (join is a confirmation state only).

---

## Explicitly out of scope

- School SSO / roster verification
- Real video, phone, or WebRTC
- Stripe / subscriptions / student discount codes
- Real peer-group chat, facilitators, moderation
- Progress “nuggets,” mood logs, notifications
- Professional vetting / admin dashboards
- PostgreSQL, encryption-at-rest, audit logs
- Insurance, crisis-escalation workflows, clinical AI

Those stay on the original roadmap. The prototype’s footer states this is a demo, not a care service.

---

## User journey (happy path)

```
Landing  →  Get started  →  8 questions  →  Matching  →  Counselor card
                                                              │
                                              Confirm ────────┤
                                                              ▼
                                    Home: messages · book slot · rematch
```

Unhappy / alternate paths:

- Crisis option → resources, no match.
- “This isn’t the right fit” on the card or at home → next-ranked counselor, same as BetterHelp’s one-click switch.
- Peer-support CTA → suggested group, optional later counselor match.

---

## Seeded data

Six campus counselors with name, credentials, bio, specialties, style (gentle/direct), identity flags, and weekly availability slots. Three mock peer groups (exam stress, first-gen, LGBTQ+ affirming). One scripted counselor reply after the student sends a first message.

---

## Visual language (inspired by BetterHelp, not a clone)

- Forest-green hero (`#325343`), mint CTA (`#a6de9b`), cream page (`#fffcf6`)
- Overpass headlines, Inter body
- Full-width dark header, rounded primary buttons, thin progress bar on intake
- No BetterHelp logo, copy, or therapist photos

Working name: **TBP**. Headline: **You deserve to feel okay here.**

---

## Done when

A stranger can click through landing → intake → match → send a message → book a slot → rematch, on desktop and a phone-width screen, with no backend and no account system. That is the whole prototype.
