"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PrimaryButton } from "@/components/Ui";

const EARLY_MS = 5 * 60_000;

export function JoinSessionButton({
  sessionId,
  scheduledAt,
  alreadyReleased,
  modality = "video",
}: {
  sessionId: string;
  scheduledAt: string;
  alreadyReleased?: boolean;
  modality?: "video" | "chat";
}) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const start = new Date(scheduledAt).getTime();
  const open = alreadyReleased || now + EARLY_MS >= start;
  const remaining = start - now;

  async function join() {
    setBusy(true);
    setError(null);
    try {
      if (modality === "chat") {
        const res = await fetch(`/api/sessions/${sessionId}/join`, { method: "POST" });
        const json = (await res.json()) as { url?: string; error?: string };
        if (!res.ok) {
          setError(json.error ?? "Chat opens at session time.");
          return;
        }
        router.push(`/app/sessions/${sessionId}/chat`);
        return;
      }

      const res = await fetch(`/api/sessions/${sessionId}/join`, { method: "POST" });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url || json.url.startsWith("chat:")) {
        setError(json.error ?? "The Meet link is not available yet.");
        return;
      }
      window.open(json.url, "_blank", "noopener,noreferrer");
    } catch {
      setError(modality === "chat" ? "Could not open chat." : "Could not open Meet.");
    } finally {
      setBusy(false);
    }
  }

  const label =
    modality === "chat"
      ? open
        ? "Open chat session"
        : `Chat opens ${formatRemaining(remaining)}`
      : open
        ? "Join Google Meet"
        : `Opens ${formatRemaining(remaining)}`;

  return (
    <div className="text-right">
      <PrimaryButton onClick={() => void join()} disabled={busy || !open}>
        {busy ? "Opening…" : label}
      </PrimaryButton>
      {modality === "chat" && open ? (
        <p className="mt-2 text-xs text-muted">
          Or{" "}
          <Link href={`/app/sessions/${sessionId}/chat`} className="font-semibold text-navy underline">
            go to chat
          </Link>
        </p>
      ) : null}
      {error ? <p className="mt-2 max-w-xs text-sm text-danger">{error}</p> : null}
    </div>
  );
}

function formatRemaining(ms: number) {
  if (ms <= 0) return "now";
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `in ${h}h ${m}m`;
  if (m > 0) return `in ${m}m ${s}s`;
  return `in ${s}s`;
}
