import Link from "next/link";
import { MarketingHeader, SiteFooter } from "@/components/SiteChrome";

export default function LandingPage() {
  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader />
      <main>
        <section className="bg-navy text-paper">
          <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
            <p className="text-sm font-medium tracking-wide text-clay-soft">Campus care, held in confidence</p>
            <h1 className="font-display mt-4 max-w-2xl text-5xl font-light leading-[1.15] md:text-6xl">
              A programme for the issue. A group for the people who get it.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-paper/75">
              Myalo matches students with a professional for a time-bounded care plan, then keeps
              sessions on Google Meet. Between hours, peer groups — created by students or
              professionals — hold check-ins and track growth.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup?role=student" className="rounded-full bg-clay px-5 py-3 text-sm font-semibold text-paper">
                I’m a student
              </Link>
              <Link href="/signup?role=professional" className="rounded-full border border-paper/30 px-5 py-3 text-sm font-semibold text-paper">
                I’m a professional
              </Link>
            </div>
            {!process.env.NEXT_PUBLIC_SUPABASE_URL ? (
              <p className="mt-6 max-w-xl text-sm text-clay-soft">
                Connect Supabase to go live: copy `.env.example` to `.env.local` and run
                `supabase/migrations/20260813_init.sql` in the SQL editor.
              </p>
            ) : null}
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-5 py-16 md:grid-cols-3">
          {[
            {
              title: "Match, then subscribe",
              body: "Intake informs a proposed professional. You see who they are before you subscribe. Care does not start until you opt in.",
            },
            {
              title: "Sessions on a timeline",
              body: "Each issue maps to a programme length. Your professional schedules Meet sessions; the join link is released when that time arrives.",
            },
            {
              title: "Groups you can run",
              body: "Students and professionals can create communities, stay on as admins, and host check-ins so growth is visible — not just promised.",
            },
          ].map((s) => (
            <article key={s.title} className="rounded-2xl bg-white p-6 ring-1 ring-line">
              <h2 className="font-display text-2xl">{s.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted">{s.body}</p>
            </article>
          ))}
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <h2 className="font-display text-3xl">Confidentiality is a rule, not a slogan</h2>
            <ul className="mt-6 max-w-2xl space-y-3 text-sm leading-6 text-muted">
              <li>Intake and session notes are visible only to you and your professional.</li>
              <li>Meet links stay hidden until session time — they are not a public calendar.</li>
              <li>Platform operators are not granted default access to clinical content.</li>
              <li>Imminent harm is the stated exception, named on the consent screen.</li>
            </ul>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
