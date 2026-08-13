"use client";

import { useEffect, useState } from "react";
import { Card, PrimaryButton } from "@/components/Ui";
import { createClient } from "@/lib/supabase/client";
import type { SessionRow } from "@/lib/types";

export default function StudentSessions() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data } = await supabase
        .from("sessions")
        .select("*")
        .eq("student_id", auth.user.id)
        .order("scheduled_at", { ascending: false });
      setSessions((data as SessionRow[]) ?? []);
    })();
  }, []);

  async function join(id: string) {
    setMessage(null);
    const res = await fetch(`/api/sessions/${id}/join`, { method: "POST" });
    const json = (await res.json()) as { url?: string; error?: string };
    if (!res.ok || !json.url) {
      setMessage(json.error ?? "Not available yet");
      return;
    }
    window.open(json.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div>
      <h1 className="font-display text-3xl">Sessions</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Your professional schedules these after you subscribe. The Google Meet link is released at
        the session time — Myalo does not host video.
      </p>
      {message ? <p className="mt-4 text-sm text-clay">{message}</p> : null}
      <div className="mt-6 space-y-3">
        {sessions.length === 0 ? <p className="text-muted">No sessions scheduled yet.</p> : null}
        {sessions.map((s) => {
          const open = Boolean(s.meet_released_at) || s.status === "released";
          return (
            <Card key={s.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{new Date(s.scheduled_at).toLocaleString()}</p>
                <p className="text-sm text-muted">{s.duration_min} minutes · {s.status}</p>
              </div>
              <PrimaryButton onClick={() => join(s.id)}>
                {open ? "Join Google Meet" : "Join at session time"}
              </PrimaryButton>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
