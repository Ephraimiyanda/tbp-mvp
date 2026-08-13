import Link from "next/link";
import { MarketingHeader, SiteFooter } from "@/components/SiteChrome";

export default function LandingPage() {
  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader />
      <main>
        <section className="bg-navy text-paper">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-[1.15fr_0.85fr] md:py-24">
            <div>
              <p className="text-sm font-medium tracking-wide text-clay">
                Counseling and peer support for campus
              </p>
              <h1 className="font-display mt-4 max-w-xl text-5xl font-light leading-[1.1] tracking-tight md:text-6xl">
                You deserve to feel okay here.
              </h1>
              <p className="mt-8 text-lg text-paper/85">What kind of support are you looking for?</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <PathCard href="/get-started" title="Individual" subtitle="Counseling for me" />
                <PathCard href="/get-started?intent=peer" title="Peer support" subtitle="With other students" />
                <PathCard href="/signup?role=professional" title="Professional" subtitle="I provide care" />
              </div>
              <p className="mt-6 text-sm text-paper/60">
                Short questionnaire. Then a match you can see before you subscribe.
              </p>
            </div>
            <div className="rounded-2xl bg-navy-soft p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-clay">How matching feels</p>
              <ul className="mt-5 space-y-4 text-paper/90">
                {[
                  "Answer a few questions — one screen at a time.",
                  "See the professional before you subscribe.",
                  "They schedule sessions; you join on Google Meet.",
                  "Switch if it isn’t the right fit.",
                ].map((line) => (
                  <li key={line} className="flex gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-clay" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-navy-soft">
          <div className="mx-auto grid max-w-6xl grid-cols-1 divide-y divide-white/10 px-5 md:grid-cols-3 md:divide-x md:divide-y-0">
            {[
              { value: "8 questions", label: "Typical intake" },
              { value: "Subscribe", label: "Before any session is booked" },
              { value: "1 click", label: "To see another professional" },
            ].map((s) => (
              <div key={s.label} className="py-8 text-center">
                <p className="font-display text-3xl font-light text-clay">{s.value}</p>
                <p className="mt-2 text-sm text-paper/70">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="scroll-mt-20 bg-paper">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <p className="text-sm font-semibold text-ok">How it works</p>
            <h2 className="font-display mt-2 max-w-2xl text-4xl font-light">
              Get matched. Talk how you want. Come back between sessions.
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {[
                {
                  n: "1",
                  title: "Get matched to a professional who fits",
                  body: "A short questionnaire covers what’s going on, how you like to talk, and optional identity preferences. You see the person before you subscribe.",
                },
                {
                  n: "2",
                  title: "Subscribe, then they schedule",
                  body: "Care starts when you opt in. Your professional books Google Meet sessions on a timeline that follows your presenting issue.",
                },
                {
                  n: "3",
                  title: "Groups when campus hours aren’t",
                  body: "Join or create a peer group. Check in, track growth, and read nuggets from the professional you subscribe to.",
                },
              ].map((step) => (
                <article key={step.n} className="rounded-2xl bg-white p-6 ring-1 ring-line">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-sm font-semibold text-clay">
                    {step.n}
                  </span>
                  <h3 className="font-display mt-5 text-xl font-semibold">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted">{step.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <h2 className="font-display text-3xl font-light">Myalo vs. the campus counseling center</h2>
            <div className="mt-8 overflow-x-auto rounded-2xl border border-line">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead className="bg-navy text-paper">
                  <tr>
                    <th className="px-5 py-3 font-medium"> </th>
                    <th className="px-5 py-3 font-medium">Myalo</th>
                    <th className="px-5 py-3 font-medium">Campus center</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {[
                    ["Matched to your concerns and preferences", "Yes", "Usually assigned"],
                    ["See the professional before you start", "Yes", "Rare"],
                    ["Switch without an awkward conversation", "Yes", "Hard"],
                    ["Peer groups you can run", "Yes", "Sometimes"],
                    ["Walk-in emergency / crisis care", "No — use campus emergency", "Yes"],
                  ].map((row) => (
                    <tr key={row[0]}>
                      <td className="px-5 py-3 font-medium">{row[0]}</td>
                      <td className="px-5 py-3 text-ok">{row[1]}</td>
                      <td className="px-5 py-3 text-muted">{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section id="faq" className="scroll-mt-20 bg-paper">
          <div className="mx-auto max-w-3xl px-5 py-20">
            <h2 className="font-display text-3xl font-light">Frequently asked questions</h2>
            <dl className="mt-10 space-y-8">
              {[
                {
                  q: "Who are the professionals?",
                  a: "Licensed or credentialed clinicians who sign up on Myalo, list specialties, and schedule their own Google Meet sessions. You see their profile before you subscribe.",
                },
                {
                  q: "How does matching work?",
                  a: "Your answers are scored against professional specialties, tone, and optional identity preferences. It is a rules engine, not a black box — and you can tap “see someone else.”",
                },
                {
                  q: "When do I create an account?",
                  a: "After the questionnaire, the same pattern as large online-care funnels: questions first, account at the end, then a match.",
                },
                {
                  q: "Is this therapy?",
                  a: "Myalo connects you with a professional for a time-bounded programme. It is not emergency care and not a substitute for a campus clinic in crisis.",
                },
              ].map((f) => (
                <div key={f.q}>
                  <dt className="font-semibold">{f.q}</dt>
                  <dd className="mt-2 text-sm leading-6 text-muted">{f.a}</dd>
                </div>
              ))}
            </dl>
            <Link
              href="/get-started"
              className="mt-10 inline-flex rounded-md bg-navy px-6 py-3 text-sm font-semibold text-paper"
            >
              Get started
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function PathCard({
  href,
  title,
  subtitle,
}: {
  href: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Link href={href} className="rounded-xl bg-paper px-4 py-4 text-ink transition hover:bg-clay">
      <span className="block font-display text-lg font-semibold">{title}</span>
      <span className="mt-1 block text-sm text-muted">{subtitle}</span>
    </Link>
  );
}
