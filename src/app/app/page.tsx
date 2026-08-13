"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
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

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("*, profiles:professional_id(full_name)")
        .eq("student_id", auth.user.id)
        .eq("status", "active")
        .limit(1);
      const row = subs?.[0] as (Subscription & { profiles?: { full_name: string } }) | undefined;
      if (row) {
        setSub({ ...row, professional: row.profiles });
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
          .select("*, profiles:professional_id(full_name)")
          .eq("professional_id", row.professional_id)
          .order("created_at", { ascending: false })
          .limit(3);
        setNuggets(
          ((nuggetRows ?? []) as (Nugget & { profiles?: { full_name: string } })[]).map((n) => ({
            ...n,
            author: n.profiles?.full_name,
          })),
        );
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="text-muted">Loading…</p>;

  if (!sub) {
    return (
      <div className="grid items-center gap-8 md:grid-cols-[1fr_0.7fr]">
        <div>
          <h1 className="font-display text-3xl">Start with a match</h1>
          <p className="mt-2 max-w-xl text-muted">
            You’ll see a professional first, then pay to subscribe. Care does not begin until payment
            succeeds.
          </p>
          <Link
            href="/app/match"
            className="mt-6 inline-flex cursor-pointer rounded-full bg-navy px-6 py-3 text-sm font-semibold text-paper hover:bg-navy-soft"
          >
            See a professional
          </Link>
          <Link href="/app/groups" className="ml-4 text-sm font-semibold text-navy underline">
            Browse peer communities
          </Link>
        </div>
        <div className="mx-auto w-full max-w-xs">
          <HeroMatch />
        </div>
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
      <h1 className="font-display text-3xl">Your care</h1>
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
        <Card>
          <p className="text-xs uppercase tracking-wide text-muted">Next session</p>
          <p className="mt-2 font-medium">
            {nextSession
              ? `${new Date(nextSession.scheduled_at).toLocaleString()} · ${
                  nextSession.modality === "chat" ? "Chat" : "Meet"
                }`
              : "Waiting for your professional to schedule"}
          </p>
          {nextSession ? (
            <Link href="/app/sessions" className="mt-2 inline-block text-sm font-semibold text-navy underline">
              Open sessions
            </Link>
          ) : null}
        </Card>
      </div>

      <section>
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">Nuggets from your professional</h2>
            <p className="mt-1 text-sm text-muted">Short skills and encouragement unlocked after you subscribe.</p>
          </div>
          <Link href="/app/nuggets" className="text-sm font-semibold text-navy underline">
            See all
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {nuggets.length === 0 ? (
            <p className="text-sm text-muted">No nuggets yet — check back soon.</p>
          ) : (
            nuggets.map((n) => (
              <Card key={n.id}>
                <p className="text-xs text-muted">{n.author}</p>
                <h3 className="mt-1 font-semibold">{n.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{n.body}</p>
              </Card>
            ))
          )}
        </div>
      </section>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/app/sessions" className="font-semibold text-navy">
          Sessions
        </Link>
        <Link href="/app/groups" className="font-semibold text-navy">
          Peer groups
        </Link>
        <Link href="/app/nuggets" className="font-semibold text-navy">
          Nuggets
        </Link>
      </div>
    </div>
  );
}

export default function StudentHome() {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <StudentHomeInner />
    </Suspense>
  );
}
