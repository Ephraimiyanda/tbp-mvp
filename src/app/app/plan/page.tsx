"use client";

import { useEffect, useState } from "react";
import { BackButton } from "@/components/NavControls";
import { PageLoading } from "@/components/PageLoading";
import { StudentLoopPlan } from "@/components/StudentLoopPlan";
import type { LoopPlan } from "@/lib/care-loop";

export default function StudentPlanPage() {
  const [plan, setPlan] = useState<LoopPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/loop/plans");
      const json = (await res.json().catch(() => ({}))) as { error?: string; plan?: LoopPlan | null };
      if (!res.ok) setError(json.error || "Could not load plan");
      else setPlan(json.plan ?? null);
      setLoading(false);
    })();
  }, []);

  if (loading) return <PageLoading label="Loading your plan…" />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <BackButton href="/app" label="Home" />
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ok">Care Loop</p>
        <h1 className="font-display mt-2 text-3xl font-light">{plan?.title ?? "Your plan"}</h1>
        <p className="mt-2 text-sm text-muted">
          Work through these between sessions. The line above the list is how ready you are for the next
          one. If you get stuck, ask for a bridge — it does not replace your professional.
        </p>
      </div>
      {error ? <p className="text-danger">{error}</p> : null}
      {!plan ? (
        <p className="text-sm text-muted">
          No follow-up plan yet. After a session, your professional will publish exercises here.
        </p>
      ) : (
        <StudentLoopPlan plan={plan} onChange={setPlan} />
      )}
    </div>
  );
}
