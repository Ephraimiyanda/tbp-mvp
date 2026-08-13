import Link from "next/link";
import { MarketingHeader, SiteFooter } from "@/components/SiteChrome";
import { WAVE_CLEAR, WaveEdge } from "@/components/WaveDivider";
import {
  HeroConversation,
  StepCalendar,
  StepPeers,
  StepQuestions,
} from "@/components/illustrations";

export default function LandingPage() {
  return (
    <div className="flex min-h-full flex-col bg-navy-soft">
      <div className="bg-navy text-paper">
        <MarketingHeader />
        <section>
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-10 pt-4 md:grid-cols-[1.05fr_0.95fr] md:pt-6">
            <div>
              <p className="text-sm font-medium tracking-wide text-clay">
                Counseling and peer support for campus
              </p>
              <h1 className="font-display mt-4 max-w-xl text-5xl font-light leading-[1.1] tracking-tight md:text-6xl">
                You deserve to feel okay here.
              </h1>
              <p className="mt-8 text-lg text-paper/80">What kind of support are you looking for?</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <PathCard href="/signup" title="Individual" subtitle="Counseling for me" />
                <PathCard href="/signup?intent=peer" title="Peer support" subtitle="With other students" />
                <PathCard href="/signup?role=professional" title="Professional" subtitle="I provide care" />
              </div>
              <p className="mt-6 text-sm text-paper/60">
                Sign up with a short questionnaire. Then a match you can see before you subscribe.
              </p>
            </div>
            <div className="relative">
              <HeroConversation />
              <p className="mt-2 text-center text-xs tracking-wide text-paper/55">
                A calm conversation, on your timeline.
              </p>
            </div>
          </div>
        </section>
        <WaveEdge color="navy" />
      </div>

      <main className="flex-1">
        <section className="bg-white">
          <div className="relative z-20 mx-auto max-w-6xl px-5 pt-8 md:pt-10">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { value: "8 questions", label: "During signup" },
                { value: "Subscribe", label: "Before any session is booked" },
                { value: "1 click", label: "To see another professional" },
              ].map((s) => (
                <div key={s.label} className="rounded-3xl bg-sky-soft px-6 py-8 text-center">
                  <p className="font-display text-3xl font-light text-navy">{s.value}</p>
                  <p className="mt-2 text-sm text-muted">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div id="how" className="scroll-mt-20 mx-auto max-w-6xl px-5 py-16">
            <p className="text-sm font-semibold text-ok">How it works</p>
            <h2 className="font-display mt-2 max-w-2xl text-4xl font-light text-navy">
              Get matched. Talk how you want. Come back between sessions.
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {[
                {
                  n: "1",
                  title: "Sign up by answering a few questions",
                  body: "Onboarding is the questionnaire. We cover what’s going on, how you like to talk, and optional identity preferences — then you create your account.",
                  art: <StepQuestions className="h-16 w-24" />,
                },
                {
                  n: "2",
                  title: "Subscribe, then they schedule",
                  body: "Care starts when you opt in. Your professional books Google Meet sessions on a timeline that follows your presenting issue.",
                  art: <StepCalendar className="h-16 w-24" />,
                },
                {
                  n: "3",
                  title: "Groups when campus hours aren’t",
                  body: "Join or create a peer group. Check in, track growth, and read nuggets from the professional you subscribe to.",
                  art: <StepPeers className="h-16 w-24" />,
                },
              ].map((step) => (
                <article key={step.n} className="rounded-3xl bg-sky-soft p-6">
                  {step.art}
                  <span className="mt-3 flex h-9 w-9 items-center justify-center rounded-full bg-navy text-sm font-semibold text-clay">
                    {step.n}
                  </span>
                  <h3 className="font-display mt-4 text-xl font-semibold text-navy">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted">{step.body}</p>
                </article>
              ))}
            </div>
          </div>
          <WaveEdge color="white" />
        </section>

        <section className="bg-sky-soft">
          <div className={`mx-auto max-w-6xl px-5 pb-16 ${WAVE_CLEAR}`}>
            <h2 className="font-display text-3xl font-light text-navy">Myalo vs. the campus counseling center</h2>
            <div className="mt-8 overflow-x-auto rounded-3xl border border-line bg-white">
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
          <WaveEdge color="mist" />
        </section>

        <section id="faq" className="scroll-mt-20 bg-white">
          <div className={`mx-auto max-w-3xl px-5 pb-16 ${WAVE_CLEAR}`}>
            <h2 className="font-display text-3xl font-light text-navy">Frequently asked questions</h2>
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
                  a: "At the end of signup. The questionnaire is the onboarding — a few questions, then your name, email, and password. We then ask you to confirm your email before you log in.",
                },
                {
                  q: "Is this therapy?",
                  a: "Myalo connects you with a professional for a time-bounded programme. It is not emergency care and not a substitute for a campus clinic in crisis.",
                },
              ].map((f) => (
                <div key={f.q}>
                  <dt className="font-semibold text-navy">{f.q}</dt>
                  <dd className="mt-2 text-sm leading-6 text-muted">{f.a}</dd>
                </div>
              ))}
            </dl>
            <Link
              href="/signup"
              className="mt-10 inline-flex cursor-pointer rounded-full bg-navy px-6 py-3 text-sm font-semibold text-paper hover:bg-navy-soft"
            >
              Sign up
            </Link>
          </div>
          <WaveEdge color="white" />
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
      className="cursor-pointer rounded-2xl bg-white px-4 py-4 text-ink transition hover:bg-clay"
    >
      <span className="block font-display text-lg font-semibold text-navy">{title}</span>
      <span className="mt-1 block text-sm text-muted">{subtitle}</span>
    </Link>
  );
}
