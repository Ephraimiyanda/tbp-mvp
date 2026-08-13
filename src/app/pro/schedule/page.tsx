"use client";

import { useEffect, useState } from "react";
import { Card, Field, PrimaryButton, TextArea, TextInput } from "@/components/Ui";
import { createClient } from "@/lib/supabase/client";
import type { Profile, SessionRow, Subscription } from "@/lib/types";

export default function ProSchedule() {
  const [clients, setClients] = useState<(Subscription & { student?: Profile })[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [studentId, setStudentId] = useState("");
  const [when, setWhen] = useState("");
  const [meet, setMeet] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function reload() {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("*, profiles:student_id(*)")
      .eq("professional_id", auth.user.id)
      .eq("status", "active");
    setClients(
      ((subs ?? []) as (Subscription & { profiles?: Profile })[]).map((s) => ({
        ...s,
        student: s.profiles,
      })),
    );
    const { data: sess } = await supabase
      .from("sessions")
      .select("*")
      .eq("professional_id", auth.user.id)
      .order("scheduled_at", { ascending: false });
    setSessions((sess as SessionRow[]) ?? []);
  }

  useEffect(() => {
    void reload();
  }, []);

  async function schedule(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const sub = clients.find((c) => c.student_id === studentId);
    if (!sub) {
      setMessage("Pick a subscriber");
      setBusy(false);
      return;
    }
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: studentId,
        subscription_id: sub.id,
        scheduled_at: new Date(when).toISOString(),
        meet_url: meet || undefined,
        notes_professional: notes || undefined,
      }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) setMessage(json.error ?? "Could not schedule");
    else {
      setMessage("Session scheduled. The student will get the Meet link at that time.");
      setNotes("");
      await reload();
    }
    setBusy(false);
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_1fr]">
      <div>
        <h1 className="font-display text-3xl">Schedule a session</h1>
        <p className="mt-2 text-sm text-muted">
          If Google Calendar is connected, Myalo mints a Meet link. Otherwise paste one. The student
          cannot open it until the scheduled time.
        </p>
        <form onSubmit={schedule} className="mt-6 space-y-4">
          <Field label="Subscriber">
            <select
              className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
            >
              <option value="">Select…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.student_id}>
                  {c.student?.full_name ?? c.student_id}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Start">
            <TextInput type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} required />
          </Field>
          <Field label="Google Meet URL (if Calendar is not connected)">
            <TextInput value={meet} onChange={(e) => setMeet(e.target.value)} placeholder="https://meet.google.com/…" />
          </Field>
          <Field label="Private notes (only you see these)">
            <TextArea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          {message ? <p className="text-sm text-clay">{message}</p> : null}
          <PrimaryButton type="submit" disabled={busy}>
            {busy ? "Scheduling…" : "Schedule session"}
          </PrimaryButton>
        </form>
      </div>
      <div>
        <h2 className="font-display text-2xl">Upcoming</h2>
        <div className="mt-4 space-y-3">
          {sessions.map((s) => (
            <Card key={s.id}>
              <p className="font-medium">{new Date(s.scheduled_at).toLocaleString()}</p>
              <p className="text-sm text-muted">{s.status} · {s.duration_min} min</p>
              {s.notes_professional ? (
                <p className="mt-2 text-sm italic text-muted">Note: {s.notes_professional}</p>
              ) : null}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
