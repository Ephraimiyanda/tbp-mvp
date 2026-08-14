"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BackButton, CareTabs, NavButton } from "@/components/NavControls";
import { Card, PrimaryButton } from "@/components/Ui";
import { matchReasons, rankProfessionals } from "@/lib/matching";
import { createClient } from "@/lib/supabase/client";
import { initials, type Intake, type Professional } from "@/lib/types";

export default function MatchProfessionalPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasIntake, setHasIntake] = useState(true);
  const [subscribedProId, setSubscribedProId] = useState<string | null>(null);
  const [candidate, setCandidate] = useState<{
    professional: Professional;
    reasons: string[];
  } | null>(null);
  const [poolSize, setPoolSize] = useState(0);
  const [nextId, setNextId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    void load(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function load(professionalId: string) {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;

    const { data: activeSub } = await supabase
      .from("subscriptions")
      .select("professional_id")
      .eq("student_id", auth.user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    setSubscribedProId((activeSub?.professional_id as string | undefined) ?? null);

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

    const { data: priorMatches } = await supabase
      .from("matches")
      .select("professional_id, status")
      .eq("student_id", auth.user.id);
    const declined = new Set(
      (priorMatches ?? [])
        .filter((m) => m.status === "declined")
        .map((m) => m.professional_id as string),
    );

    const res = await fetch(`/api/directory/${professionalId}`);
    const json = (await res.json().catch(() => ({}))) as {
      error?: string;
      professional?: Professional;
    };
    if (!res.ok || !json.professional?.credentials) {
      setError(json.error || "Professional not found");
      setCandidate(null);
      setLoading(false);
      return;
    }

    const dir = await fetch("/api/directory");
    const directory = (await dir.json().catch(() => ({}))) as {
      professionals?: Professional[];
    };
    const list = (directory.professionals ?? []).filter(
      (p) => p.credentials && !declined.has(p.profile_id),
    );
    setPoolSize(list.length);
    const ranked = rankProfessionals(intakeRow as Intake, list);
    const remaining = ranked.filter((r) => r.professional.profile_id !== professionalId);
    setNextId(remaining[0]?.professional.profile_id ?? null);

    setCandidate({
      professional: json.professional,
      reasons: matchReasons(intakeRow as Intake, json.professional),
    });
    setHasIntake(true);
    setLoading(false);
  }

  async function propose() {
    if (!candidate || !id || subscribedProId) return;
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
    router.replace(`/app/subscribe/${candidate.professional.profile_id}`);
  }

  async function seeSomeoneElse() {
    if (!candidate || !id) return;
    // Don't decline your active subscribed professional from this control.
    if (subscribedProId === id) {
      if (nextId) router.push(`/app/match/${nextId}`);
      else router.push("/app/match");
      return;
    }
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    await supabase.from("matches").upsert(
      {
        student_id: auth.user.id,
        professional_id: id,
        status: "declined",
        reasons: [],
      },
      { onConflict: "student_id,professional_id" },
    );
    if (nextId) router.replace(`/app/match/${nextId}`);
    else router.replace("/app/match");
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <BackButton href="/app" label="Home" />
        <p className="text-danger">{error}</p>
      </div>
    );
  }
  if (loading) return <p className="text-muted">Finding your match…</p>;

  if (!hasIntake) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <BackButton href="/app" label="Home" />
        <h1 className="font-display text-3xl font-light">Finish signup first</h1>
        <p className="mt-2 text-sm text-muted">
          Matching uses the answers you give while creating your account. Complete signup once — we
          won’t ask again.
        </p>
        <NavButton href="/signup" variant="primary">
          Continue signup
        </NavButton>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <BackButton href="/app" label="Home" />
        <h1 className="font-display text-3xl font-light">No professionals yet</h1>
        <p className="mt-2 text-sm text-muted">
          Demo clinicians should appear here after seed. You can still join a peer group.
        </p>
        <NavButton href="/app/groups" variant="primary">
          Browse groups
        </NavButton>
      </div>
    );
  }

  const pro = candidate.professional;
  const name = pro.profiles?.full_name ?? "Professional";
  const isCurrentCare = subscribedProId === id;
  const alreadyInCare = Boolean(subscribedProId);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackButton href="/app" label="Home" />
        <CareTabs />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ok">
          {isCurrentCare ? "Your professional" : alreadyInCare ? "Browse professionals" : "Your match is ready"}
        </p>
        <h1 className="font-display mt-2 text-4xl font-light">
          {isCurrentCare ? name : `Meet ${name.split(" ")[0]}`}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {isCurrentCare
            ? "This is who you’re subscribed to. Use the tabs above for sessions, groups, and nuggets."
            : alreadyInCare
              ? "You already have an active programme. You can still browse other profiles."
              : `You can see this person before you subscribe. If it isn’t the right fit, see someone else${
                  poolSize > 1 ? ` (${poolSize} available)` : ""
                }.`}
        </p>
      </div>
      <Card className="p-6">
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
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          className="cursor-pointer text-sm font-medium text-muted hover:text-navy"
          onClick={() => void seeSomeoneElse()}
        >
          See someone else
        </button>
        {alreadyInCare ? (
          <NavButton href="/app" variant="primary">
            Back to care home
          </NavButton>
        ) : (
          <PrimaryButton onClick={() => void propose()}>Continue to subscribe</PrimaryButton>
        )}
      </div>
      <p className="text-xs text-muted">
        Matching proposes. Subscribing starts the programme.{" "}
        <Link href="/crisis" className="font-semibold text-navy">
          Crisis resources
        </Link>
      </p>
    </div>
  );
}
