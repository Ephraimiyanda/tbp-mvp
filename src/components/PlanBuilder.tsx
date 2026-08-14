"use client";

import { useEffect, useState } from "react";
import { BackButton } from "@/components/NavControls";
import { PageLoading } from "@/components/PageLoading";
import { ProgressLine } from "@/components/ProgressLine";
import { Card, Field, PrimaryButton, TextArea, TextInput } from "@/components/Ui";
import { progressRatio, type ExerciseDraft, type LoopPlan } from "@/lib/care-loop";

export function PlanBuilder({
  sessionId,
  studentName,
  backHref,
}: {
  sessionId: string;
  studentName: string;
  backHref: string;
}) {
  const [plan, setPlan] = useState<LoopPlan | null>(null);
  const [title, setTitle] = useState("Between-session plan");
  const [exercises, setExercises] = useState<ExerciseDraft[]>([{ title: "", instructions: "", resource_url: "" }]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const created = await fetch("/api/loop/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const json = (await created.json().catch(() => ({}))) as { error?: string; plan?: LoopPlan };
      if (!created.ok || !json.plan) {
        setError(json.error || "Could not open plan");
        setLoading(false);
        return;
      }
      setPlan(json.plan);
      setTitle(json.plan.title);
      setExercises(
        json.plan.exercises.length
          ? json.plan.exercises.map((e) => ({
              title: e.title,
              instructions: e.instructions,
              resource_url: e.resource_url ?? "",
            }))
          : [{ title: "", instructions: "", resource_url: "" }],
      );
      setLoading(false);
    })();
  }, [sessionId]);

  function patch(i: number, partial: Partial<ExerciseDraft>) {
    setExercises((list) => list.map((e, idx) => (idx === i ? { ...e, ...partial } : e)));
  }

  function move(i: number, dir: -1 | 1) {
    setExercises((list) => {
      const j = i + dir;
      if (j < 0 || j >= list.length) return list;
      const next = [...list];
      const tmp = next[i];
      next[i] = next[j];
      next[j] = tmp;
      return next;
    });
  }

  async function save(publish: boolean) {
    if (!plan) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    const res = await fetch(`/api/loop/plans/${plan.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, exercises }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string; plan?: LoopPlan };
    if (!res.ok || !json.plan) {
      setError(json.error || "Could not save");
      setBusy(false);
      return;
    }
    setPlan(json.plan);
    if (publish) {
      const pub = await fetch(`/api/loop/plans/${plan.id}/publish`, { method: "POST" });
      const pubJson = (await pub.json().catch(() => ({}))) as { error?: string; plan?: LoopPlan };
      if (!pub.ok) {
        setError(pubJson.error || "Could not publish");
        setBusy(false);
        return;
      }
      setPlan(pubJson.plan ?? json.plan);
      setMessage("Plan published. The student will see it as their between-session checklist.");
    } else {
      setMessage("Draft saved.");
    }
    setBusy(false);
  }

  async function suggest() {
    if (!plan) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/loop/plans/${plan.id}/suggest`, { method: "POST" });
    const json = (await res.json().catch(() => ({}))) as { error?: string; suggestions?: ExerciseDraft[] };
    setBusy(false);
    if (!res.ok) {
      setError(json.error || "Could not suggest");
      return;
    }
    const incoming = json.suggestions ?? [];
    setExercises((list) => {
      const filled = list.filter((e) => e.title.trim());
      const titles = new Set(filled.map((e) => e.title));
      const extra = incoming.filter((e) => !titles.has(e.title));
      return [...filled, ...extra].length ? [...filled, ...extra] : incoming;
    });
    setMessage("Suggestions added — edit or remove anything before publishing. You stay in charge.");
  }

  if (loading) return <PageLoading label="Opening plan…" />;
  if (error && !plan) {
    return (
      <div className="space-y-4">
        <BackButton href={backHref} label="Back" />
        <p className="text-danger">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <BackButton href={backHref} label="Client" />
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ok">Care Loop</p>
        <h1 className="font-display mt-2 text-3xl font-light">Plan for {studentName}</h1>
        <p className="mt-2 text-sm text-muted">
          After this session, give them concrete exercises for the gap. Incomplete work does not roll over —
          each cycle starts a new plan. Prior plans stay in history.
        </p>
      </div>
      {plan && plan.exercises.some((e) => e.completed_at || e.stuck) ? (
        <Card>
          <ProgressLine
            done={progressRatio(plan.exercises).done}
            total={progressRatio(plan.exercises).total}
          />
          {plan.exercises.some((e) => e.stuck) ? (
            <ul className="mt-3 space-y-1 text-sm text-muted">
              {plan.exercises
                .filter((e) => e.stuck)
                .map((e) => (
                  <li key={e.id}>
                    <span className="font-medium text-navy">{e.title}</span> — student used AI assist
                    (a bridge, not a replacement).
                  </li>
                ))}
            </ul>
          ) : null}
        </Card>
      ) : null}
      <Field label="Plan title">
        <TextInput value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <div className="space-y-3">
        {exercises.map((ex, i) => (
          <Card key={i}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs uppercase text-muted">Exercise {i + 1}</p>
              <div className="flex gap-2 text-xs">
                <button type="button" className="cursor-pointer text-navy" onClick={() => move(i, -1)}>
                  Up
                </button>
                <button type="button" className="cursor-pointer text-navy" onClick={() => move(i, 1)}>
                  Down
                </button>
                <button
                  type="button"
                  className="cursor-pointer text-danger"
                  onClick={() => setExercises((list) => list.filter((_, idx) => idx !== i))}
                >
                  Remove
                </button>
              </div>
            </div>
            <div className="mt-3 space-y-3">
              <Field label="Task">
                <TextInput value={ex.title} onChange={(e) => patch(i, { title: e.target.value })} />
              </Field>
              <Field label="Instructions">
                <TextArea rows={3} value={ex.instructions} onChange={(e) => patch(i, { instructions: e.target.value })} />
              </Field>
              <Field label="Optional resource URL">
                <TextInput
                  value={ex.resource_url ?? ""}
                  onChange={(e) => patch(i, { resource_url: e.target.value })}
                  placeholder="https://"
                />
              </Field>
            </div>
          </Card>
        ))}
      </div>
      <button
        type="button"
        className="cursor-pointer text-sm font-semibold text-navy"
        onClick={() => setExercises((list) => [...list, { title: "", instructions: "", resource_url: "" }])}
      >
        + Add exercise
      </button>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {message ? <p className="text-sm text-ok">{message}</p> : null}
      <div className="flex flex-wrap gap-3">
        <PrimaryButton onClick={() => void suggest()} disabled={busy}>
          Suggest from session notes
        </PrimaryButton>
        <PrimaryButton onClick={() => void save(false)} disabled={busy} className="bg-navy-soft">
          Save draft
        </PrimaryButton>
        <PrimaryButton onClick={() => void save(true)} disabled={busy}>
          {busy ? "Saving…" : "Publish to student"}
        </PrimaryButton>
      </div>
    </div>
  );
}
