"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { JoinSessionButton } from "@/components/JoinSessionButton";
import { BackButton, NavButton } from "@/components/NavControls";
import { PageLoading } from "@/components/PageLoading";
import { ProgressLine } from "@/components/ProgressLine";
import { Card, Field, OptionButton, PrimaryButton, TextInput } from "@/components/Ui";
import { progressRatio, type LoopPlan } from "@/lib/care-loop";
import { createClient } from "@/lib/supabase/client";
import type { Profile, SessionRow, Subscription } from "@/lib/types";

type SessionType = "chat" | "video";

type ClientSub = Subscription & { student?: Profile };

export default function ProClientPage() {
  const params = useParams();
  const studentId = String(params.id ?? "");
  const [sub, setSub] = useState<ClientSub | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [plans, setPlans] = useState<LoopPlan[]>([]);
  const [sessionType, setSessionType] = useState<SessionType>("chat");
  const [meetUrl, setMeetUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setError("Sign in required");
      setLoading(false);
      return;
    }

    const { data: rows } = await supabase
      .from("subscriptions")
      .select("*, profiles:student_id(*)")
      .eq("professional_id", auth.user.id)
      .eq("student_id", studentId)
      .eq("status", "active")
      .limit(1);
    const row = (rows?.[0] as (Subscription & { profiles?: Profile }) | undefined) ?? null;
    if (!row) {
      setError("No active match with this student.");
      setLoading(false);
      return;
    }
    const client: ClientSub = { ...row, student: row.profiles };
    setSub(client);
    setSessionType(client.session_type === "video" ? "video" : "chat");
    setMeetUrl(client.meet_url ?? "");

    const { data: sess } = await supabase
      .from("sessions")
      .select("*")
      .eq("professional_id", auth.user.id)
      .eq("student_id", studentId)
      .order("scheduled_at", { ascending: false });
    setSessions((sess as SessionRow[]) ?? []);

    const planRes = await fetch(`/api/loop/plans?student_id=${encodeURIComponent(studentId)}&history=1`);
    const planJson = (await planRes.json().catch(() => ({}))) as { plans?: LoopPlan[] };
    setPlans(planJson.plans ?? []);
    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveSessionType(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/care/session-type", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: studentId,
        session_type: sessionType,
        meet_url: sessionType === "video" ? meetUrl : null,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    setSaving(false);
    if (!res.ok) {
      setMessage(json.error ?? "Could not save.");
      return;
    }
    setMessage("Session type saved. You can change this anytime.");
    await load();
  }

  if (loading) return <PageLoading label="Loading client…" />;

  if (error || !sub) {
    return (
      <div className="space-y-4">
        <BackButton href="/pro" label="Clients" />
        <p className="text-danger">{error ?? "Client not found."}</p>
      </div>
    );
  }

  const now = Date.now();
  const upcoming = sessions.filter(
    (s) => s.status === "scheduled" && new Date(s.scheduled_at).getTime() >= now - 60 * 60_000,
  );
  const past = sessions.filter((s) => !upcoming.includes(s));
  const planSession = past[0] ?? upcoming[0];

  return (
    <div className="space-y-6">
      <BackButton href="/pro" label="Clients" />
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ok">Matched student</p>
        <h1 className="font-display mt-2 text-3xl">{sub.student?.full_name ?? "Student"}</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Choose chat or video for this match. After a session, send a Care Loop plan they can work
          through at home.
        </p>
      </header>

      <form onSubmit={(e) => void saveSessionType(e)} className="space-y-4">
        <h2 className="font-display text-2xl">How you will meet</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <OptionButton selected={sessionType === "chat"} onClick={() => setSessionType("chat")}>
            <p className="font-semibold">Chat</p>
            <p className="mt-1 text-sm text-muted">In-app session room with messages.</p>
          </OptionButton>
          <OptionButton selected={sessionType === "video"} onClick={() => setSessionType("video")}>
            <p className="font-semibold">Video</p>
            <p className="mt-1 text-sm text-muted">Join a video call. Add a meeting link below.</p>
          </OptionButton>
        </div>
        {sessionType === "video" ? (
          <Field label="Meeting link">
            <TextInput
              required
              type="url"
              value={meetUrl}
              onChange={(e) => setMeetUrl(e.target.value)}
              placeholder="https://meet.google.com/…"
            />
          </Field>
        ) : null}
        {message ? <p className="text-sm text-ok">{message}</p> : null}
        <PrimaryButton type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save session type"}
        </PrimaryButton>
      </form>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl">Upcoming sessions</h2>
          <NavButton href="/pro/schedule">Schedule</NavButton>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted">No upcoming sessions. Book one from the schedule.</p>
        ) : (
          upcoming.map((session) => (
            <Card key={session.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{new Date(session.scheduled_at).toLocaleString()}</p>
                <p className="text-sm text-muted">
                  {session.duration_min} min · {session.modality === "chat" ? "Chat" : "Video"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <NavButton href={`/pro/sessions/${session.id}/plan`}>Plan</NavButton>
                <JoinSessionButton
                  sessionId={session.id}
                  scheduledAt={session.scheduled_at}
                  alreadyReleased={Boolean(session.meet_released_at)}
                  modality={session.modality === "chat" ? "chat" : "video"}
                />
              </div>
            </Card>
          ))
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl">Care Loop plans</h2>
          {planSession ? (
            <NavButton href={`/pro/sessions/${planSession.id}/plan`} variant="primary">
              Build a plan
            </NavButton>
          ) : (
            <NavButton href="/pro/schedule" variant="primary">
              Schedule first
            </NavButton>
          )}
        </div>
        {plans.length === 0 ? (
          <p className="text-sm text-muted">
            No plans yet. After a session, send exercises they can complete before the next one.
            Incomplete work does not roll over — each cycle is a new plan.
          </p>
        ) : (
          plans.map((plan) => {
            const stats = progressRatio(plan.exercises);
            const stuck = plan.exercises.filter((e) => e.stuck).length;
            return (
              <Card key={plan.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{plan.title}</p>
                    <p className="mt-1 text-sm capitalize text-muted">
                      {plan.status}
                      {plan.session_at
                        ? ` · session ${new Date(plan.session_at).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>
                  <NavButton href={`/pro/sessions/${plan.session_id}/plan`}>Open</NavButton>
                </div>
                {plan.status === "published" || stats.total > 0 ? (
                  <div className="mt-4">
                    <ProgressLine done={stats.done} total={stats.total} />
                    {stuck ? (
                      <p className="mt-2 text-sm text-navy">
                        {stuck} sticking point{stuck === 1 ? "" : "s"} flagged via AI assist — a
                        bridge, not a replacement for you.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </Card>
            );
          })
        )}
      </section>
    </div>
  );
}
