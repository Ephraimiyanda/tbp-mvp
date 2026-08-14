"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BackButton, NavButton } from "@/components/NavControls";
import { PageLoading } from "@/components/PageLoading";
import { Card, PrimaryButton } from "@/components/Ui";
import type { SessionRow } from "@/lib/types";

export function SessionHub({
  sessionId,
  basePath,
}: {
  sessionId: string;
  basePath: "/app" | "/pro";
}) {
  const router = useRouter();
  const [session, setSession] = useState<SessionRow | null>(null);
  const [meetUrl, setMeetUrl] = useState<string | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/sessions/${sessionId}`);
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        session?: SessionRow;
        meet_url?: string | null;
        loop_plan?: { id: string; status: string } | null;
      };
      if (!res.ok || !json.session) {
        setError(json.error || "Session not found");
        return;
      }
      setSession(json.session);
      setMeetUrl(json.meet_url ?? null);
      setPlanId(json.loop_plan?.id ?? null);

      if (json.session.modality === "chat") {
        const join = await fetch(`/api/sessions/${sessionId}/join`, { method: "POST" });
        if (join.ok) {
          router.replace(`${basePath}/sessions/${sessionId}/chat`);
          return;
        }
        const failed = (await join.json().catch(() => ({}))) as { error?: string };
        setError(failed.error || "Chat opens at session time.");
      }
    })();
  }, [sessionId, basePath, router]);

  async function openMeet() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/sessions/${sessionId}/join`, { method: "POST" });
    const json = (await res.json()) as { url?: string; error?: string };
    setBusy(false);
    if (!res.ok || !json.url || json.url.startsWith("chat:")) {
      setError(json.error ?? "The meeting link is not available yet.");
      return;
    }
    setMeetUrl(json.url);
    window.open(json.url, "_blank", "noopener,noreferrer");
  }

  if (error && (!session || session.modality === "chat")) {
    return (
      <div className="space-y-4">
        <BackButton href={`${basePath}/sessions`} label="Sessions" />
        <p className="text-danger">{error}</p>
      </div>
    );
  }

  if (!session || session.modality === "chat") {
    return <PageLoading label="Opening session…" />;
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <BackButton href={`${basePath}/sessions`} label="Sessions" />
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ok">Video session</p>
        <h1 className="font-display mt-2 text-3xl font-light">Open Session</h1>
        <p className="mt-2 text-sm text-muted">
          {new Date(session.scheduled_at).toLocaleString()} · {session.duration_min} minutes
        </p>
      </div>
      <Card>
        <p className="text-sm leading-6 text-muted">
          Your professional attached a meeting link. Join when you are ready — the room stays the same if you
          need to come back.
        </p>
        {meetUrl ? (
          <p className="mt-3 break-all text-sm font-medium text-navy">{meetUrl}</p>
        ) : (
          <p className="mt-3 text-sm text-muted">The link unlocks at session time.</p>
        )}
        <div className="mt-5">
          <PrimaryButton onClick={() => void openMeet()} disabled={busy}>
            {busy ? "Opening…" : "Join video call"}
          </PrimaryButton>
        </div>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      </Card>
      {basePath === "/pro" ? (
        <NavButton href={`/pro/sessions/${sessionId}/plan`} variant="primary">
          {planId ? "Edit follow-up plan" : "Build follow-up plan"}
        </NavButton>
      ) : null}
    </div>
  );
}
