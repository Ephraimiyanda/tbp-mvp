"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/Ui";
import { HeroMatch } from "@/components/illustrations";
import { createClient } from "@/lib/supabase/client";
import { CARE_PLANS, concernLabel, type CarePlan, type SessionRow, type Subscription } from "@/lib/types";

export default function StudentHome() {
  const [sub, setSub] = useState<(Subscription & { professional?: { full_name: string } }) | null>(null);
  const [plan, setPlan] = useState<CarePlan | null>(null);
  const [nextSession, setNextSession] = useState<SessionRow | null>(null);
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
            You’ll see a professional first, then subscribe. Care does not begin until you do.
          </p>
          <Link href="/app/match" className="mt-6 inline-flex cursor-pointer rounded-full bg-navy px-6 py-3 text-sm font-semibold text-paper hover:bg-navy-soft">
            See a professional
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
              ? new Date(nextSession.scheduled_at).toLocaleString()
              : "Waiting for your professional to schedule"}
          </p>
        </Card>
      </div>
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
