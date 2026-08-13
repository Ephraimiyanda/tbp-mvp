"use client";

import { useEffect, useState } from "react";
import { JoinMeetButton } from "@/components/JoinMeetButton";
import { Card } from "@/components/Ui";
import { createClient } from "@/lib/supabase/client";
import type { SessionRow } from "@/lib/types";

export default function StudentSessions() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);

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

  return (
    <div>
      <h1 className="font-display text-3xl">Sessions</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Your professional schedules these after you subscribe. Tap Join when the time arrives —
        Myalo then releases the Google Meet link. Nothing is pushed on a server cron.
      </p>
      <div className="mt-6 space-y-3">
        {sessions.length === 0 ? <p className="text-muted">No sessions scheduled yet.</p> : null}
        {sessions.map((s) => (
          <Card key={s.id} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium">{new Date(s.scheduled_at).toLocaleString()}</p>
              <p className="text-sm text-muted">{s.duration_min} minutes</p>
            </div>
            <JoinMeetButton
              sessionId={s.id}
              scheduledAt={s.scheduled_at}
              alreadyReleased={Boolean(s.meet_released_at)}
            />
          </Card>
        ))}
      </div>
    </div>
  );
}
