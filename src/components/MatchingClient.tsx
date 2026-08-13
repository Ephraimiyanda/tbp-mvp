"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Logo } from "@/components/Logo";
import { pickMatch } from "@/lib/matching";
import { loadSession, saveSession } from "@/lib/storage";

export function MatchingClient() {
  const router = useRouter();

  useEffect(() => {
    const session = loadSession();
    if (!session?.consented) {
      router.replace("/get-started?path=counseling");
      return;
    }
    if (session.concerns.includes("crisis")) {
      router.replace("/crisis");
      return;
    }
    const match = pickMatch(session);
    const timer = window.setTimeout(() => {
      if (!match) {
        router.replace("/get-started?path=counseling");
        return;
      }
      saveSession({ ...session, counselorId: match.id });
      router.replace("/match");
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-full flex-col bg-forest text-cream">
      <header className="mx-auto flex h-16 w-full max-w-3xl items-center px-5">
        <Logo inverted />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-5 pb-24 text-center">
        <span className="tbp-pulse h-16 w-16 rounded-full bg-mint" />
        <h1 className="font-display mt-8 text-3xl font-light">
          Matching you with a counselor…
        </h1>
        <p className="mt-3 max-w-md text-sm text-cream/70">
          BetterHelp often takes hours. This prototype ranks our six seeded counselors
          against your answers in a couple of seconds.
        </p>
      </main>
    </div>
  );
}
