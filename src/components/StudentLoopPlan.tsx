"use client";

import { useState } from "react";
import { ProgressLine } from "@/components/ProgressLine";
import { Card, PrimaryButton, TextInput } from "@/components/Ui";
import { progressRatio, type LoopPlan } from "@/lib/care-loop";

export function StudentLoopPlan({
  plan,
  onChange,
}: {
  plan: LoopPlan;
  onChange: (plan: LoopPlan) => void;
}) {
  const stats = progressRatio(plan.exercises);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [assistFor, setAssistFor] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [assistText, setAssistText] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function toggle(id: string, completed: boolean) {
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/loop/exercises/${id}/complete`, { method: completed ? "DELETE" : "POST" });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    setBusyId(null);
    if (!res.ok) {
      setError(json.error || "Could not update");
      return;
    }
    onChange({
      ...plan,
      exercises: plan.exercises.map((e) =>
        e.id === id ? { ...e, completed_at: completed ? null : new Date().toISOString() } : e,
      ),
    });
  }

  async function assist(id: string) {
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/loop/exercises/${id}/assist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      error?: string;
      assist?: { suggestion: string };
    };
    setBusyId(null);
    if (!res.ok) {
      setError(json.error || "Could not get help");
      return;
    }
    setAssistText((m) => ({ ...m, [id]: json.assist?.suggestion ?? "" }));
    onChange({
      ...plan,
      exercises: plan.exercises.map((e) => (e.id === id ? { ...e, stuck: true } : e)),
    });
    setQuestion("");
  }

  return (
    <div className="space-y-5">
      <ProgressLine done={stats.done} total={stats.total} />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="space-y-3">
        {plan.exercises.map((ex) => {
          const done = Boolean(ex.completed_at);
          return (
            <Card key={ex.id} className={done ? "border-ok/30 bg-sky-soft/40" : ""}>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 cursor-pointer accent-[var(--navy)]"
                  checked={done}
                  disabled={busyId === ex.id}
                  onChange={() => void toggle(ex.id, done)}
                />
                <span>
                  <span className={`font-semibold ${done ? "text-muted line-through" : "text-navy"}`}>{ex.title}</span>
                  <span className="mt-1 block text-sm leading-6 text-muted">{ex.instructions}</span>
                  {ex.resource_url ? (
                    <a
                      href={ex.resource_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-sm font-semibold text-navy"
                    >
                      Resource
                    </a>
                  ) : null}
                </span>
              </label>
              {assistText[ex.id] ? (
                <p className="mt-3 rounded-xl bg-sky-soft px-3 py-2 text-sm leading-6 text-navy">
                  <span className="text-xs font-semibold uppercase tracking-wide">AI bridge — not your professional</span>
                  <span className="mt-1 block">{assistText[ex.id]}</span>
                </p>
              ) : null}
              {assistFor === ex.id ? (
                <div className="mt-3 space-y-2">
                  <TextInput
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="What’s getting stuck?"
                  />
                  <div className="flex gap-2">
                    <PrimaryButton onClick={() => void assist(ex.id)} disabled={busyId === ex.id}>
                      {busyId === ex.id ? "Thinking…" : "Ask for a way through"}
                    </PrimaryButton>
                    <button
                      type="button"
                      className="cursor-pointer text-sm text-muted"
                      onClick={() => setAssistFor(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="mt-3 cursor-pointer text-sm font-semibold text-navy"
                  onClick={() => setAssistFor(ex.id)}
                >
                  I’m stuck
                </button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
