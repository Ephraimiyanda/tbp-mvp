"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CareTabs, NavButton, PressableCard } from "@/components/NavControls";
import { PageLoading } from "@/components/PageLoading";
import { Card } from "@/components/Ui";
import { HeroMatch } from "@/components/illustrations";
import { createClient } from "@/lib/supabase/client";
import {
  CARE_PLANS,
  concernLabel,
  type CarePlan,
  type Nugget,
  type SessionRow,
  type Subscription,
} from "@/lib/types";

function StudentHomeInner() {
  const params = useSearchParams();
  const paid = params.get("paid") === "1";
  const [sub, setSub] = useState<(Subscription & { professional?: { full_name: string } }) | null>(null);
  const [plan, setPlan] = useState<CarePlan | null>(null);
  const [nextSession, setNextSession] = useState<SessionRow | null>(null);
  const [nuggets, setNuggets] = useState<(Nugget & { author?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoPros, setDemoPros] = useState<
    { profile_id: string; credentials: string | null; profiles?: { full_name: string } | null }[]
  >([]);
  const [demoGroups, setDemoGroups] = useState<{ id: string; name: string; description: string | null }[]>([]);

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("student_id", auth.user.id)
        .eq("status", "active")
        .limit(1);
      const row = subs?.[0] as Subscription | undefined;
      if (row) {
        const dir = await fetch("/api/directory");
        let proName = "Your professional";
        if (dir.ok) {
          const json = (await dir.json()) as {
            professionals?: { profile_id: string; profiles?: { full_name: string } | null }[];
          };
          proName =
            json.professionals?.find((p) => p.profile_id === row.professional_id)?.profiles?.full_name ??
            proName;
        }
        setSub({ ...row, professional: { full_name: proName } });
        const { data: plans } = await supabase
          .from("care_plans")
          .select("*")
          .eq("subscription_id", row.id)
          .maybeSingle();
        setPlan(plans as CarePlan | null);
        const { data: sessions } = await supabase
          .from("sessions")
          .select("*")
          .eq("student_id", auth.user.id)
          .gte("scheduled_at", new Date(Date.now() - 3600_000).toISOString())
          .order("scheduled_at")
          .limit(1);
        setNextSession((sessions?.[0] as SessionRow) ?? null);
        const { data: nuggetRows } = await supabase
          .from("nuggets")
          .select("*")
          .eq("professional_id", row.professional_id)
          .order("created_at", { ascending: false })
          .limit(3);
        setNuggets(
          ((nuggetRows ?? []) as Nugget[]).map((n) => ({
            ...n,
            author: proName,
          })),
        );
      } else {
        const res = await fetch("/api/directory");
        if (res.ok) {
          const json = (await res.json()) as {
            professionals?: typeof demoPros;
            groups?: typeof demoGroups;
          };
          setDemoPros((json.professionals ?? []).slice(0, 3));
          setDemoGroups((json.groups ?? []).slice(0, 3));
        }
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <PageLoading label="Loading your care…" />;

  if (!sub) {
    return (
      <div className="space-y-10">
        <div className="grid items-center gap-8 md:grid-cols-[1fr_0.7fr]">
          <div>
            <h1 className="font-display text-3xl">Start with a match</h1>
            <p className="mt-2 max-w-xl text-muted">
              You’ll see a professional first, then pay to subscribe. Care does not begin until payment
              succeeds.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <NavButton href="/app/match" variant="primary" className="px-6 py-3">
                See a professional
              </NavButton>
              <NavButton href="/app/groups">Browse peer communities</NavButton>
            </div>
          </div>
          <div className="mx-auto w-full max-w-xs">
            <HeroMatch />
          </div>
        </div>
        {demoPros.length || demoGroups.length ? (
          <section className="space-y-6">
            {demoPros.length ? (
              <div>
                <h2 className="font-display text-2xl">Professionals ready to match</h2>
                <p className="mt-1 text-sm text-muted">Demo clinicians you can subscribe to after matching.</p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {demoPros.map((p) => (
                    <PressableCard key={p.profile_id} href={`/app/match/${p.profile_id}`}>
                      <p className="font-display text-lg font-semibold">
                        {p.profiles?.full_name ?? "Professional"}
                      </p>
                      <p className="mt-1 text-sm text-muted">{p.credentials}</p>
                      <p className="mt-3 text-sm font-semibold text-navy">View match →</p>
                    </PressableCard>
                  ))}
                </div>
              </div>
            ) : null}
            {demoGroups.length ? (
              <div>
                <h2 className="font-display text-2xl">Peer communities</h2>
                <p className="mt-1 text-sm text-muted">Join without a subscription.</p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {demoGroups.map((g) => (
                    <PressableCard key={g.id} href={`/app/groups/${g.id}`}>
                      <p className="font-display text-lg font-semibold">{g.name}</p>
                      <p className="mt-1 text-sm text-muted">{g.description}</p>
                      <p className="mt-3 text-sm font-semibold text-navy">Open →</p>
                    </PressableCard>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    );
  }

  const planMeta = plan ? CARE_PLANS[plan.primary_issue as keyof typeof CARE_PLANS] : null;

  return (
    <div className="space-y-6">
      {paid ? (
        <p className="rounded-xl bg-sky-soft px-4 py-3 text-sm text-navy">
          Payment confirmed. Your programme is active, a first session is scheduled, and nuggets from your
          professional are unlocked below.
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">Your care</h1>
        <CareTabs />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-wide text-muted">Professional</p>
          <p className="mt-2 font-medium">{sub.professional?.full_name ?? "Your professional"}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-muted">Programme</p>
          <p className="mt-2 font-medium">
            {planMeta?.label ?? concernLabel(plan?.primary_issue ?? "")} · {plan?.duration_weeks} weeks
          </p>
        </Card>
        {nextSession ? (
          <PressableCard href="/app/sessions">
            <p className="text-xs uppercase tracking-wide text-muted">Next session</p>
            <p className="mt-2 font-medium">
              {new Date(nextSession.scheduled_at).toLocaleString()} ·{" "}
              {nextSession.modality === "chat" ? "Chat" : "Meet"}
            </p>
            <p className="mt-3 text-sm font-semibold text-navy">Open sessions →</p>
          </PressableCard>
        ) : (
          <Card>
            <p className="text-xs uppercase tracking-wide text-muted">Next session</p>
            <p className="mt-2 font-medium">Waiting for your professional to schedule</p>
          </Card>
        )}
      </div>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">Nuggets from your professional</h2>
            <p className="mt-1 text-sm text-muted">Short skills and encouragement unlocked after you subscribe.</p>
          </div>
          <NavButton href="/app/nuggets">See all</NavButton>
        </div>
        <div className="mt-4 space-y-3">
          {nuggets.length === 0 ? (
            <p className="text-sm text-muted">No nuggets yet — check back soon.</p>
          ) : (
            nuggets.map((n) => (
              <PressableCard key={n.id} href="/app/nuggets">
                <p className="text-xs text-muted">{n.author}</p>
                <h3 className="mt-1 font-semibold">{n.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{n.body}</p>
              </PressableCard>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default function StudentHome() {
  return (
    <Suspense fallback={<PageLoading label="Loading your care…" />}>
      <StudentHomeInner />
    </Suspense>
  );
}
