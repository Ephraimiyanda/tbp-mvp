# TBP — campus wellbeing prototype

One-day clickable prototype of a student counseling + peer-support product. Modeled on [BetterHelp `/next`](https://www.betterhelp.com/next/): landing, short intake, instant match, a thin student home.

This is a demo, not a care service. Scope is in [PROTOTYPE.md](./PROTOTYPE.md).

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What you can click through

1. Landing — pick Individual counseling, Peer support, or For a friend
2. 8-question intake (crisis option shows resources instead of matching)
3. Instant counselor match — confirm or switch
4. Home — message the counselor, book a fake session, rematch

Session state lives in `localStorage`. No database, auth, payments, or live video.
