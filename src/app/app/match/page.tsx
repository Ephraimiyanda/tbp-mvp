"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, PrimaryButton } from "@/components/Ui";
import { matchReasons, rankProfessionals } from "@/lib/matching";
import { createClient } from "@/lib/supabase/client";
import { initials, type Intake, type Professional } from "@/lib/types";

export default function MatchPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [candidate, setCandidate] = useState<{
    professional: Professional;
    reasons: string[];
  } | null>(null);
  const [skipped, setSkipped] = useState<string[]>([]);

  useEffect(() => {
    void load(skipped);
  }, [skipped]);

  async function load(skip: string[]) {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { data: intakeRow } = await supabase
      .from("intakes")
      .select("*")
      .eq("student_id", auth.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!intakeRow) return;
    const { data: pros } = await supabase.from("professionals").select("*, profiles:profile_id(*)");
    const list = ((pros ?? []) as Professional[]).filter((p) => !skip.includes(p.profile_id) && p.credentials);
    const ranked = rankProfessionals(intakeRow as Intake, list);
    const top = ranked[0];
    if (!top) {
      setCandidate(null);
      return;
    }
    setCandidate({
      professional: top.professional,
      reasons: matchReasons(intakeRow as Intake, top.professional),
    });
  }

  async function propose() {
    if (!candidate) return;
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { error: matchError } = await supabase.from("matches").upsert(
      {
        student_id: auth.user.id,
        professional_id: candidate.professional.profile_id,
        status: "proposed",
        reasons: candidate.reasons,
      },
      { onConflict: "student_id,professional_id" },
    );
    if (matchError) {
      setError(matchError.message);
      return;
    }
    router.push(`/app/subscribe/${candidate.professional.profile_id}`);
  }

  if (error) return <p className="text-danger">{error}</p>;
  if (!candidate) {
    return (
      <div>
        <h1 className="font-display text-3xl">No professionals yet</h1>
        <p className="mt-2 text-muted">Ask a clinician to sign up as a professional, then return here.</p>
      </div>
    );
  }

  const pro = candidate.professional;
  const name = pro.profiles?.full_name ?? "Professional";

  return (
    <div className="max-w-xl">
      <p className="text-xs uppercase tracking-wide text-muted">Your match</p>
      <h1 className="font-display mt-2 text-3xl">Meet {name.split(" ")[0]}</h1>
      <Card className="mt-6">
        <div className="flex gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-navy font-display text-paper">
            {initials(name)}
          </span>
          <div>
            <p className="font-semibold">{name}</p>
            <p className="text-sm text-muted">{pro.credentials}</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6">{pro.bio}</p>
        <ul className="mt-4 space-y-1 text-sm text-ok">
          {candidate.reasons.map((r) => (
            <li key={r}>• {r}</li>
          ))}
        </ul>
      </Card>
      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          className="text-sm text-muted"
          onClick={() => setSkipped((s) => [...s, pro.profile_id])}
        >
          See someone else
        </button>
        <PrimaryButton onClick={propose}>Continue to subscribe</PrimaryButton>
      </div>
      <p className="mt-4 text-xs text-muted">
        Matching proposes. Subscribing starts the programme.{" "}
        <Link href="/crisis" className="underline">
          Crisis resources
        </Link>
      </p>
    </div>
  );
}
