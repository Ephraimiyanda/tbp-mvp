"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PrimaryButton } from "@/components/Ui";

const EARLY_MS = 5 * 60_000;

export function JoinSessionButton({
  sessionId,
  scheduledAt,
  alreadyReleased,
}: {
  sessionId: string;
  scheduledAt: string;
  alreadyReleased?: boolean;
  modality?: "video" | "chat";
}) {
  const router = useRouter();
  const path = usePathname();
  const basePath = path.startsWith("/pro") ? "/pro" : "/app";
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
      router.push(`${basePath}/sessions/${sessionId}`);
    } catch {
      setError("Could not open session.");
    } finally {
      setBusy(false);
    }
  }

  const label = open ? "Open Session" : `Opens ${formatRemaining(remaining)}`;

  return (
    <div className="text-right">
      <PrimaryButton onClick={() => void join()} disabled={busy || !open}>
        {busy ? "Opening…" : label}
      </PrimaryButton>
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
