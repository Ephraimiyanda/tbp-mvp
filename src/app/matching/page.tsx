"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { HeroMatch } from "@/components/illustrations";
import { clearDraft, draftIsReady, loadDraft } from "@/lib/intake-draft";
import { persistIntake } from "@/lib/persist-intake";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

const LINES = [
  "Reading what you shared…",
  "Looking at specialties and tone…",
  "Finding a professional who fits…",
];

export default function MatchingPage() {
  const router = useRouter();
  const [line, setLine] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const cycle = window.setInterval(() => setLine((n) => (n + 1) % LINES.length), 700);
    const started = Date.now();

    void (async () => {
      if (isSupabaseConfigured()) {
        try {
          const draft = loadDraft();
          if (draftIsReady(draft)) {
            const supabase = createClient();
            const { data } = await supabase.auth.getUser();
            if (data.user) {
              await persistIntake(supabase, data.user.id, draft);
              clearDraft();
            }
          }
        } catch {
          // Match page sends the student back to signup if intake is missing.
        }
      }
      const wait = Math.max(0, 2200 - (Date.now() - started));
      await new Promise((resolve) => window.setTimeout(resolve, wait));
      if (!cancelled) router.replace("/app/match");
    })();

    return () => {
      cancelled = true;
      window.clearInterval(cycle);
    };
  }, [router]);

  return (
    <div className="flex min-h-full flex-col bg-navy text-paper">
      <header className="mx-auto flex h-16 w-full max-w-3xl items-center px-5">
        <Logo inverted />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-5 pb-16 text-center">
        <div className="w-full max-w-sm">
          <HeroMatch />
        </div>
        <span
          className="mt-6 h-9 w-9 animate-spin rounded-full border-2 border-paper/25 border-t-clay"
          aria-hidden
        />
        <h1 className="font-display mt-4 text-3xl font-light">Matching you with a professional…</h1>
        <p className="mt-3 max-w-md text-sm text-paper/75">{LINES[line]}</p>
      </main>
    </div>
  );
}
