"use client";

import { useEffect, useState } from "react";
import { JoinSessionButton } from "@/components/JoinSessionButton";
import { BackButton, NavButton } from "@/components/NavControls";
import { PageLoading } from "@/components/PageLoading";
import { Card } from "@/components/Ui";
import { createClient } from "@/lib/supabase/client";
import type { Profile, SessionRow } from "@/lib/types";

type Row = SessionRow & { student?: Profile | null };

export default function ProSessionsPage() {
  const [sessions, setSessions] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("sessions")
        .select("*, profiles:student_id(*)")
        .eq("professional_id", auth.user.id)
        .order("scheduled_at", { ascending: false });
      setSessions(
        ((data ?? []) as (SessionRow & { profiles?: Profile })[]).map((s) => ({
          ...s,
          student: s.profiles,
        })),
      );
      setLoading(false);
    })();
  }, []);

  if (loading) return <PageLoading label="Loading sessions…" />;

  return (
    <div>
      <BackButton href="/pro" label="Clients" />
      <h1 className="font-display mt-3 text-3xl">Sessions</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Open a session room, or send a Care Loop plan after you meet.
      </p>
      <div className="mt-6 space-y-3">
        {sessions.length === 0 ? <p className="text-muted">No sessions yet. Book one from the schedule.</p> : null}
        {sessions.map((s) => (
          <Card key={s.id} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium">{s.student?.full_name ?? "Student"}</p>
              <p className="text-sm text-muted">
                {new Date(s.scheduled_at).toLocaleString()} · {s.duration_min} min ·{" "}
                {s.modality === "chat" ? "Chat" : "Video"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <NavButton href={`/pro/sessions/${s.id}/plan`}>Plan</NavButton>
              <JoinSessionButton
                sessionId={s.id}
                scheduledAt={s.scheduled_at}
                alreadyReleased={Boolean(s.meet_released_at)}
                modality={s.modality === "chat" ? "chat" : "video"}
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
