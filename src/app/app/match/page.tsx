"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BackButton, CareTabs, NavButton } from "@/components/NavControls";
import { PageLoading } from "@/components/PageLoading";
import { matchReasons, rankProfessionals } from "@/lib/matching";
import { createClient } from "@/lib/supabase/client";
import type { Intake, Professional } from "@/lib/types";

/** Resolves the next professional and routes to /app/match/[id]. */
export default function MatchIndexPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [hasIntake, setHasIntake] = useState(true);
  const [empty, setEmpty] = useState(false);
  const [activeProId, setActiveProId] = useState<string | null>(null);
  const [activeProName, setActiveProName] = useState<string | null>(null);
  const [resolving, setResolving] = useState(true);

  useEffect(() => {
    void (async () => {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setResolving(false);
        return;
      }

      const { data: activeSub } = await supabase
        .from("subscriptions")
        .select("professional_id")
        .eq("student_id", auth.user.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      // Already in care — stay on Match (do not bounce to Home).
      if (activeSub?.professional_id) {
        const proId = activeSub.professional_id as string;
        setActiveProId(proId);
        const res = await fetch(`/api/directory/${proId}`);
        if (res.ok) {
          const json = (await res.json()) as { professional?: Professional };
          setActiveProName(json.professional?.profiles?.full_name ?? "Your professional");
        } else {
          setActiveProName("Your professional");
        }
        setResolving(false);
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
        setResolving(false);
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
        setResolving(false);
        return;
      }

      const list = (json.professionals ?? []).filter(
        (p) => p.credentials && !declined.has(p.profile_id),
      );
      const ranked = rankProfessionals(intakeRow as Intake, list);
      const top = ranked[0];
      if (!top) {
        setEmpty(true);
        setResolving(false);
        return;
      }

      void matchReasons(intakeRow as Intake, top.professional);
      router.replace(`/app/match/${top.professional.profile_id}`);
    })();
  }, [router]);

  if (activeProId) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <BackButton href="/app" label="Home" />
          <CareTabs />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ok">Already matched</p>
          <h1 className="font-display mt-2 text-4xl font-light">
            You’re with {activeProName?.split(" ")[0] ?? "your professional"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            Your programme is active. Open sessions, nuggets, or peer groups from the tabs above — or
            review their profile below.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <NavButton href={`/app/match/${activeProId}`} variant="primary">
            View profile
          </NavButton>
          <NavButton href="/app">Back to care home</NavButton>
        </div>
      </div>
    );
  }

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

  if (resolving) return <PageLoading label="Finding your match…" />;
  return <PageLoading label="Opening your match…" />;
}
