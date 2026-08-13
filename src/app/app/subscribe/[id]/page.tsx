"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, PrimaryButton } from "@/components/Ui";
import { createClient } from "@/lib/supabase/client";
import { concernLabel, initials, planForConcerns, type Intake, type Professional } from "@/lib/types";

export default function SubscribePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [pro, setPro] = useState<Professional | null>(null);
  const [plan, setPlan] = useState<ReturnType<typeof planForConcerns> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data: professional } = await supabase
        .from("professionals")
        .select("*, profiles:profile_id(*)")
        .eq("profile_id", id)
        .single();
      setPro(professional as Professional);
      const { data: intake } = await supabase
        .from("intakes")
        .select("*")
        .eq("student_id", auth.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (intake) setPlan(planForConcerns((intake as Intake).concerns));
    })();
  }, [id]);

  async function subscribe() {
    if (!pro || !plan) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sign in required");
      const { data: match } = await supabase
        .from("matches")
        .select("id")
        .eq("student_id", auth.user.id)
        .eq("professional_id", pro.profile_id)
        .maybeSingle();
      const { data: sub, error: subError } = await supabase
        .from("subscriptions")
        .upsert(
          {
            student_id: auth.user.id,
            professional_id: pro.profile_id,
            match_id: match?.id ?? null,
            status: "active",
            plan: "student",
          },
          { onConflict: "student_id,professional_id" },
        )
        .select("id")
        .single();
      if (subError || !sub) throw subError ?? new Error("Could not subscribe");
      await supabase.from("matches").update({ status: "subscribed" }).eq("id", match?.id ?? "");
      const { error: planError } = await supabase.from("care_plans").upsert(
        {
          subscription_id: sub.id,
          primary_issue: plan.issue,
          duration_weeks: plan.weeks,
          session_target: plan.sessions,
        },
        { onConflict: "subscription_id" },
      );
      if (planError) throw planError;
      router.push("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not subscribe");
    } finally {
      setBusy(false);
    }
  }

  if (!pro || !plan) return <p className="text-muted">Loading…</p>;
  const name = pro.profiles?.full_name ?? "Professional";

  return (
    <div className="mx-auto max-w-xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ok">Start care</p>
      <h1 className="font-display mt-2 text-4xl font-light">Subscribe to begin this programme</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        Nothing is booked until you opt in. After you subscribe, {name.split(" ")[0]} schedules Google Meet
        sessions on a timeline that follows what you shared.
      </p>
      <Card className="mt-8 p-6">
        <div className="flex gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-navy font-display text-lg text-paper">
            {initials(name)}
          </span>
          <div>
            <p className="font-display text-lg font-semibold">{name}</p>
            <p className="text-sm text-muted">{pro.credentials}</p>
          </div>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted">Focus</dt>
            <dd className="mt-1 font-medium">{concernLabel(plan.issue)}</dd>
          </div>
          <div>
            <dt className="text-muted">Length</dt>
            <dd className="mt-1 font-medium">
              {plan.weeks} weeks · {plan.sessions} sessions
            </dd>
          </div>
        </dl>
      </Card>
      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
      <div className="mt-8 flex items-center justify-between gap-4">
        <Link href="/app/match" className="text-sm font-medium text-muted hover:text-ink">
          See someone else
        </Link>
        <PrimaryButton onClick={() => void subscribe()} disabled={busy}>
          {busy ? "Starting…" : "Subscribe to the student plan"}
        </PrimaryButton>
      </div>
    </div>
  );
}
