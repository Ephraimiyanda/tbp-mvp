"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BackButton, NavButton } from "@/components/NavControls";
import { matchReasons, rankProfessionals } from "@/lib/matching";
import { createClient } from "@/lib/supabase/client";
import type { Intake, Professional } from "@/lib/types";

/** Resolves the next professional and routes to /app/match/[id]. */
export default function MatchIndexPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [hasIntake, setHasIntake] = useState(true);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    void (async () => {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;

      const { data: activeSub } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("student_id", auth.user.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      if (activeSub) {
        router.replace("/app");
        return;
      }

      const { data: proposed } = await supabase
        .from("matches")
        .select("professional_id")
        .eq("student_id", auth.user.id)
        .eq("status", "proposed")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (proposed?.professional_id) {
        router.replace(`/app/match/${proposed.professional_id}`);
        return;
      }

      const { data: intakeRow } = await supabase
        .from("intakes")
        .select("*")
        .eq("student_id", auth.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!intakeRow) {
        setHasIntake(false);
        return;
      }

      const { data: priorMatches } = await supabase
        .from("matches")
        .select("professional_id, status")
        .eq("student_id", auth.user.id);
      const declined = new Set(
        (priorMatches ?? [])
          .filter((m) => m.status === "declined")
          .map((m) => m.professional_id as string),
      );

      const res = await fetch("/api/directory");
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        professionals?: Professional[];
      };
      if (!res.ok) {
        setError(json.error || "Could not load professionals");
        return;
      }

      const list = (json.professionals ?? []).filter(
        (p) => p.credentials && !declined.has(p.profile_id),
      );
      const ranked = rankProfessionals(intakeRow as Intake, list);
      const top = ranked[0];
      if (!top) {
        setEmpty(true);
        return;
      }

      // Warm reasons so subscribe can reuse proposed row later
      void matchReasons(intakeRow as Intake, top.professional);
      router.replace(`/app/match/${top.professional.profile_id}`);
    })();
  }, [router]);

  if (!hasIntake) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <BackButton href="/app" label="Home" />
        <h1 className="font-display text-3xl font-light">Finish signup first</h1>
        <p className="text-sm text-muted">Complete signup once — we won’t ask again.</p>
        <NavButton href="/signup" variant="primary">
          Continue signup
        </NavButton>
      </div>
    );
  }

  if (error || empty) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <BackButton href="/app" label="Home" />
        <h1 className="font-display text-3xl font-light">
          {error ? "Could not load matches" : "No professionals yet"}
        </h1>
        {error ? <p className="text-danger">{error}</p> : null}
        <NavButton href="/app/groups" variant="primary">
          Browse groups
        </NavButton>
        <p className="text-sm text-muted">
          <Link href="/app" className="font-semibold text-navy">
            Back to home
          </Link>
        </p>
      </div>
    );
  }

  return <p className="text-muted">Finding your match…</p>;
}
