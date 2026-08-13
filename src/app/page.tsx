import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

const stats = [
  { value: "6", label: "Counselors in this demo" },
  { value: "<2 min", label: "From questions to a match" },
  { value: "1 click", label: "To switch if it isn’t a fit" },
];

const steps = [
  {
    n: "1",
    title: "Get matched to a counselor who fits",
    body: "Answer a few questions about what’s going on and how you like to talk. We rank a small campus roster — no 48-hour wait in this prototype.",
  },
  {
    n: "2",
    title: "Communicate your way",
    body: "Message between sessions, or book a live slot. Same idea as BetterHelp: the relationship isn’t only the scheduled hour.",
  },
  {
    n: "3",
    title: "Support when campus hours aren’t",
    body: "Optional peer groups for exam stress, first-gen life, and affirming space. Switch counselors without an awkward conversation.",
  },
];

const faqs = [
  {
    q: "Who are the counselors?",
    a: "In production they would be licensed, vetted professionals. In this prototype they are six seeded profiles used to demonstrate matching — not real clinicians you can book.",
  },
  {
    q: "How does matching work?",
    a: "A weighted rules engine: your concerns, communication style, and optional identity preferences scored against counselor specialties. Instant in the demo; BetterHelp typically takes hours to a couple of days.",
  },
  {
    q: "Is this therapy?",
    a: "No. TBP is a clickable product prototype. It is not a substitute for campus counseling, licensed care, or emergency services.",
  },
  {
    q: "What about privacy?",
    a: "This demo stores answers only in your browser (localStorage). Nothing is sent to a server. A real launch would need consent, encryption, and a hard rule: never share health data with advertisers.",
  },
  {
    q: "Can I switch counselors?",
    a: "Yes — one click, no explanation required. That’s one of the BetterHelp mechanics worth copying.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main>
        <section className="bg-forest text-cream">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
            <div>
              <p className="text-sm font-medium tracking-wide text-mint">
                Counseling and peer support for campus
              </p>
              <h1 className="font-display mt-4 max-w-xl text-5xl font-light leading-[1.1] tracking-tight md:text-6xl">
                You deserve to feel okay here.
              </h1>
              <p className="mt-8 text-lg text-cream/85">
                What kind of support are you looking for?
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <PathCard
                  href="/get-started?path=counseling"
                  title="Individual"
                  subtitle="Counseling for me"
                />
                <PathCard
                  href="/get-started?path=peer"
                  title="Peer support"
                  subtitle="With other students"
                />
                <PathCard
                  href="/share"
                  title="For a friend"
                  subtitle="Share TBP"
                />
              </div>
              <p className="mt-6 text-sm text-cream/60">
                Prototype demo. Not a clinical service. No payment, no waitlist, no real sessions.
              </p>
            </div>
            <div className="rounded-2xl bg-forest-deep p-6 shadow-xl">
              <p className="text-xs uppercase tracking-[0.2em] text-mint">How matching feels</p>
              <ul className="mt-5 space-y-4">
                {[
                  "Short intake — eight screens, not fourteen.",
                  "See the counselor before you confirm.",
                  "Message them the same day in this demo.",
                  "Switch if it isn’t the right fit.",
                ].map((line) => (
                  <li key={line} className="flex gap-3 text-cream/90">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-mint" />
                    {line}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex -space-x-3">
                {["AO", "JA", "PN", "FB", "DC"].map((ini, i) => (
                  <span
                    key={ini}
                    className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-forest-deep bg-mint font-display text-xs font-semibold text-forest"
                    style={{ zIndex: 5 - i }}
                  >
                    {ini}
                  </span>
                ))}
                <span className="flex h-11 items-center pl-5 text-sm text-cream/70">
                  6 counselors ready
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-forest-deep">
          <div className="mx-auto grid max-w-6xl grid-cols-1 divide-y divide-white/10 px-5 md:grid-cols-3 md:divide-x md:divide-y-0">
            {stats.map((s) => (
              <div key={s.label} className="py-8 text-center">
                <p className="font-display text-4xl font-light text-mint">{s.value}</p>
                <p className="mt-2 text-sm text-cream/70">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="scroll-mt-20 bg-cream">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <p className="text-sm font-semibold text-leaf-deep">How it works</p>
            <h2 className="font-display mt-2 max-w-2xl text-4xl font-light">
              Get matched. Talk how you want. Come back between sessions.
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {steps.map((step) => (
                <article key={step.n} className="rounded-2xl bg-sand p-6">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest text-sm font-semibold text-mint">
                    {step.n}
                  </span>
                  <h3 className="font-display mt-5 text-xl font-semibold">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted">{step.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-sand">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <h2 className="font-display text-3xl font-light">TBP vs. the campus counseling center</h2>
            <p className="mt-3 max-w-2xl text-muted">
              Borrowed from BetterHelp’s comparison table — rewritten for undergraduates, not a
              consumer subscription.
            </p>
            <div className="mt-8 overflow-x-auto rounded-2xl border border-line bg-white">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead className="bg-forest text-cream">
                  <tr>
                    <th className="px-5 py-3 font-medium"> </th>
                    <th className="px-5 py-3 font-medium">TBP</th>
                    <th className="px-5 py-3 font-medium">Campus center</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {[
                    ["Matched to your concerns and preferences", "Yes", "Usually assigned"],
                    ["Messaging between live sessions", "Yes", "Rare"],
                    ["Switch counselor without explaining", "Yes", "Hard"],
                    ["Optional peer groups", "Yes", "Sometimes"],
                    ["Walk-in emergency / crisis care", "No — use campus emergency", "Yes"],
                    ["Student-priced, not insurance-first", "The intent", "Often free, waitlisted"],
                  ].map((row) => (
                    <tr key={row[0]}>
                      <td className="px-5 py-3 font-medium">{row[0]}</td>
                      <td className="px-5 py-3 text-leaf-deep">{row[1]}</td>
                      <td className="px-5 py-3 text-muted">{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="bg-cream">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <h2 className="font-display text-3xl font-light">What students say they needed</h2>
            <p className="mt-2 text-sm text-muted">Prototype copy — not real reviews.</p>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                {
                  quote:
                    "I didn’t want to sit on a six-week waitlist for exam anxiety. Being able to message someone the same afternoon would have changed my semester.",
                  who: "400-level, prototype persona",
                },
                {
                  quote:
                    "The first counselor wasn’t a fit. Clicking switch — no essay, no guilt — is the part BetterHelp got right.",
                  who: "200-level, prototype persona",
                },
                {
                  quote:
                    "I wanted a first-gen group more than a professional at first. Let me opt into peers without making counseling mandatory.",
                  who: "100-level, prototype persona",
                },
              ].map((t) => (
                <blockquote key={t.who} className="rounded-2xl bg-sand p-6">
                  <p className="text-[15px] leading-7">“{t.quote}”</p>
                  <footer className="mt-4 text-sm text-muted">{t.who}</footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="scroll-mt-20 bg-white">
          <div className="mx-auto max-w-3xl px-5 py-20">
            <h2 className="font-display text-3xl font-light">Frequently asked questions</h2>
            <dl className="mt-10 space-y-8">
              {faqs.map((f) => (
                <div key={f.q}>
                  <dt className="font-semibold">{f.q}</dt>
                  <dd className="mt-2 text-sm leading-6 text-muted">{f.a}</dd>
                </div>
              ))}
            </dl>
            <Link
              href="/get-started?path=counseling"
              className="mt-10 inline-flex rounded-md bg-forest px-6 py-3 text-sm font-semibold text-cream hover:bg-forest-deep"
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
    <Link
      href={href}
      className="rounded-xl bg-cream px-4 py-4 text-ink transition hover:bg-mint"
    >
      <span className="block font-display text-lg font-semibold">{title}</span>
      <span className="mt-1 block text-sm text-muted">{subtitle}</span>
    </Link>
  );
}
