"use client";

import { useEffect, useState } from "react";
import { JoinSessionButton } from "@/components/JoinSessionButton";
import { BackButton } from "@/components/NavControls";
import { PageLoading } from "@/components/PageLoading";
import { Card } from "@/components/Ui";
import { createClient } from "@/lib/supabase/client";
import type { SessionRow } from "@/lib/types";

export default function StudentSessions() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
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
        .select("*")
        .eq("student_id", auth.user.id)
        .order("scheduled_at", { ascending: false });
      setSessions((data as SessionRow[]) ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <PageLoading label="Loading sessions…" />;

  return (
    <div>
      <BackButton href="/app" label="Home" />
      <h1 className="font-display mt-3 text-3xl">Sessions</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        After you pay and subscribe, your first session is scheduled from your preference — secure chat or
        Google Meet video. Join when the time arrives.
      </p>
      <div className="mt-6 space-y-3">
        {sessions.length === 0 ? <p className="text-muted">No sessions scheduled yet.</p> : null}
        {sessions.map((s) => (
          <Card key={s.id} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium">{new Date(s.scheduled_at).toLocaleString()}</p>
              <p className="text-sm text-muted">
                {s.duration_min} minutes · {s.modality === "chat" ? "Chat" : "Google Meet"}
              </p>
            </div>
            <JoinSessionButton
              sessionId={s.id}
              scheduledAt={s.scheduled_at}
              alreadyReleased={Boolean(s.meet_released_at)}
              modality={s.modality === "chat" ? "chat" : "video"}
            />
          </Card>
        ))}
      </div>
    </div>
  );
}
