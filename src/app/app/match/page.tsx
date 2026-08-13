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
  const [loading, setLoading] = useState(true);
  const [hasIntake, setHasIntake] = useState(true);
  const [candidate, setCandidate] = useState<{
    professional: Professional;
    reasons: string[];
  } | null>(null);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [poolSize, setPoolSize] = useState(0);

  useEffect(() => {
    void load(skipped);
  }, [skipped]);

  async function load(skip: string[]) {
    setLoading(true);
    setError(null);
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
    if (!intakeRow) {
      setHasIntake(false);
      setCandidate(null);
      setLoading(false);
      return;
    }
    setHasIntake(true);

    const res = await fetch("/api/directory");
    const json = (await res.json().catch(() => ({}))) as {
      error?: string;
      professionals?: Professional[];
    };
    if (!res.ok) {
      setError(json.error || "Could not load professionals");
      setCandidate(null);
      setLoading(false);
      return;
    }

    const list = (json.professionals ?? []).filter((p) => !skip.includes(p.profile_id) && p.credentials);
    setPoolSize(list.length);
    const ranked = rankProfessionals(intakeRow as Intake, list);
    const top = ranked[0];
    if (!top) {
      setCandidate(null);
      setLoading(false);
      return;
    }
    setCandidate({
      professional: top.professional,
      reasons: matchReasons(intakeRow as Intake, top.professional),
    });
    setLoading(false);
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
  if (loading) return <p className="text-muted">Finding your match…</p>;

  if (!hasIntake) {
    return (
      <div className="mx-auto max-w-xl">
        <h1 className="font-display text-3xl font-light">Finish signup first</h1>
        <p className="mt-2 text-sm text-muted">
          Matching uses the answers you give while creating your account. Complete signup once — we
          won’t ask again.
        </p>
        <Link
          href="/signup"
          className="mt-6 inline-flex rounded-md bg-clay px-6 py-3 text-sm font-semibold text-navy"
        >
          Continue signup
        </Link>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="mx-auto max-w-xl">
        <h1 className="font-display text-3xl font-light">No professionals yet</h1>
        <p className="mt-2 text-sm text-muted">
          Demo clinicians should appear here after seed. You can still join a peer group.
        </p>
        <Link href="/app/groups" className="mt-6 inline-block text-sm font-semibold text-navy underline">
          Browse groups
        </Link>
      </div>
    );
  }

  const pro = candidate.professional;
  const name = pro.profiles?.full_name ?? "Professional";

  return (
    <div className="mx-auto max-w-xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ok">Your match is ready</p>
      <h1 className="font-display mt-2 text-4xl font-light">Meet {name.split(" ")[0]}</h1>
      <p className="mt-2 text-sm text-muted">
        You can see this person before you subscribe. If it isn’t the right fit, see someone else
        {poolSize > 1 ? ` (${poolSize} available)` : ""}.
      </p>
      <Card className="mt-8 p-6">
        <div className="flex gap-4">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-navy font-display text-2xl text-paper">
            {initials(name)}
          </span>
          <div>
            <p className="font-display text-xl font-semibold">{name}</p>
            <p className="mt-1 text-sm text-muted">{pro.credentials}</p>
            {pro.approach ? <p className="mt-2 text-sm text-muted">{pro.approach}</p> : null}
          </div>
        </div>
        {pro.bio ? <p className="mt-5 text-sm leading-6">{pro.bio}</p> : null}
        <ul className="mt-5 space-y-2 text-sm">
          {candidate.reasons.map((r) => (
            <li key={r} className="flex gap-2 text-ok">
              <span aria-hidden>✓</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </Card>
      <div className="mt-8 flex items-center justify-between gap-4">
        <button
          type="button"
          className="cursor-pointer text-sm font-medium text-muted hover:text-navy"
          onClick={() => setSkipped((s) => [...s, pro.profile_id])}
        >
          See someone else
        </button>
        <PrimaryButton onClick={() => void propose()}>Continue to subscribe</PrimaryButton>
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
