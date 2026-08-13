"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { GhostButton, OptionButton, PrimaryButton } from "@/components/Buttons";
import { FunnelHeader } from "@/components/SiteHeader";
import { emptySession, saveSession } from "@/lib/storage";
import type { Concern, Gender, Path, SessionState } from "@/lib/types";

const CONCERNS: { id: Concern; label: string }[] = [
  { id: "exams", label: "Exam / academic stress" },
  { id: "anxiety", label: "Anxiety or panic" },
  { id: "mood", label: "Feeling down or numb" },
  { id: "homesickness", label: "Homesickness / belonging" },
  { id: "relationships", label: "Relationships or family" },
  { id: "identity", label: "Identity, orientation, or gender" },
  { id: "grief", label: "Grief or loss" },
  { id: "sleep", label: "Sleep is a mess" },
  { id: "firstgen", label: "First-gen / family pressure" },
  { id: "crisis", label: "I’m in crisis right now" },
];

export function IntakeClient() {
  const params = useSearchParams();
  const path = (params.get("path") as Path) || "counseling";
  return <IntakeForm key={path} path={path} />;
}

function IntakeForm({ path }: { path: Path }) {
  const router = useRouter();
  const [session, setSession] = useState<SessionState>(() => emptySession(path));
  const [step, setStep] = useState(0);

  const steps = useMemo(
    () => (path === "peer" ? peerSteps : counselingSteps),
    [path],
  );
  const total = steps.length;
  const current = (steps[step] ?? steps[0]) as StepId;

  function patch(partial: Partial<SessionState>) {
    setSession((s) => ({ ...s, ...partial }));
  }

  function next() {
    if (session.concerns.includes("crisis")) {
      saveSession(session);
      router.push("/crisis");
      return;
    }
    if (step < total - 1) {
      setStep((n) => n + 1);
      return;
    }
    saveSession(session);
    if (path === "peer") router.push("/peer");
    else router.push("/matching");
  }

  function canContinue() {
    switch (current) {
      case "gender":
        return Boolean(session.gender);
      case "year":
        return Boolean(session.year);
      case "concerns":
        return session.concerns.length > 0;
      case "prior":
        return Boolean(session.priorCounseling);
      case "style":
        return Boolean(session.counselorStyle && session.tone);
      case "communication":
        return Boolean(session.communication);
      case "preferences":
        return true;
      case "account":
        return Boolean(
          session.firstName?.trim() &&
            session.email?.includes("@") &&
            session.consented,
        );
      default:
        return false;
    }
  }

  if (!current) {
    return (
      <div className="flex min-h-full flex-col bg-cream">
        <FunnelHeader progress={0} />
        <div className="mx-auto w-full max-w-xl px-5 py-16 text-muted">Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col bg-cream">
      <FunnelHeader progress={((step + 1) / total) * 100} />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 py-10">
        <p className="text-xs font-medium uppercase tracking-wider text-leaf-deep">
          {path === "peer" ? "Peer support" : "Individual counseling"} · {step + 1} of {total}
        </p>
        <StepBody session={session} patch={patch} step={current} />
        <div className="mt-8 flex items-center justify-between">
          {step > 0 ? (
            <GhostButton onClick={() => setStep((n) => n - 1)}>Back</GhostButton>
          ) : (
            <GhostButton onClick={() => router.push("/")}>Cancel</GhostButton>
          )}
          <PrimaryButton onClick={next} disabled={!canContinue()}>
            {step === total - 1
              ? path === "peer"
                ? "See a group"
                : "Find a counselor"
              : "Continue"}
          </PrimaryButton>
        </div>
      </main>
    </div>
  );
}

const counselingSteps = [
  "gender",
  "year",
  "concerns",
  "prior",
  "style",
  "communication",
  "preferences",
  "account",
] as const;

const peerSteps = ["year", "concerns", "account"] as const;

type StepId = (typeof counselingSteps)[number];

function StepBody({
  session,
  patch,
  step,
}: {
  session: SessionState;
  patch: (p: Partial<SessionState>) => void;
  step: StepId;
}) {
  switch (step) {
    case "gender":
      return (
        <>
          <h1 className="font-display mt-3 text-3xl font-light">How do you identify?</h1>
          <p className="mt-2 text-sm text-muted">
            We ask so we can honor a gender preference for your counselor if you have one. You can
            skip specifics.
          </p>
          <div className="mt-6 grid gap-3">
            {(
              [
                ["woman", "Woman"],
                ["man", "Man"],
                ["nonbinary", "Non-binary"],
                ["unspecified", "Prefer not to say"],
              ] as [Gender, string][]
            ).map(([id, label]) => (
              <OptionButton
                key={id}
                selected={session.gender === id}
                onClick={() => patch({ gender: id })}
              >
                {label}
              </OptionButton>
            ))}
          </div>
        </>
      );
    case "year":
      return (
        <>
          <h1 className="font-display mt-3 text-3xl font-light">What year are you?</h1>
          <p className="mt-2 text-sm text-muted">
            Campus stand-in for BetterHelp’s age question — year of study is more useful here.
          </p>
          <div className="mt-6 grid gap-3">
            {["100-level", "200-level", "300-level", "400-level", "Postgraduate"].map((y) => (
              <OptionButton
                key={y}
                selected={session.year === y}
                onClick={() => patch({ year: y })}
              >
                {y}
              </OptionButton>
            ))}
          </div>
        </>
      );
    case "concerns":
      return (
        <>
          <h1 className="font-display mt-3 text-3xl font-light">What’s going on?</h1>
          <p className="mt-2 text-sm text-muted">Pick as many as you need. This drives the match.</p>
          <div className="mt-6 grid gap-3">
            {CONCERNS.map((c) => {
              const selected = session.concerns.includes(c.id);
              return (
                <OptionButton
                  key={c.id}
                  selected={selected}
                  onClick={() => {
                    const next = selected
                      ? session.concerns.filter((x) => x !== c.id)
                      : [...session.concerns, c.id];
                    patch({ concerns: next });
                  }}
                >
                  {c.label}
                </OptionButton>
              );
            })}
          </div>
        </>
      );
    case "prior":
      return (
        <>
          <h1 className="font-display mt-3 text-3xl font-light">Have you been in counseling before?</h1>
          <div className="mt-6 grid gap-3">
            {(
              [
                ["no", "No — this would be new"],
                ["yes", "Yes"],
                ["unsure", "Not sure / informal support only"],
              ] as const
            ).map(([id, label]) => (
              <OptionButton
                key={id}
                selected={session.priorCounseling === id}
                onClick={() => patch({ priorCounseling: id })}
              >
                {label}
              </OptionButton>
            ))}
          </div>
        </>
      );
    case "style":
      return (
        <>
          <h1 className="font-display mt-3 text-3xl font-light">What do you want from a counselor?</h1>
          <div className="mt-6 grid gap-3">
            {(
              [
                ["listens", "Mostly listens and reflects"],
                ["skills", "Teaches skills I can use"],
                ["challenges", "Challenges me when I’m stuck"],
              ] as const
            ).map(([id, label]) => (
              <OptionButton
                key={id}
                selected={session.counselorStyle === id}
                onClick={() => patch({ counselorStyle: id })}
              >
                {label}
              </OptionButton>
            ))}
          </div>
          <p className="mt-8 text-sm font-medium">Tone</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {(
              [
                ["gentle", "Gentle"],
                ["direct", "Direct"],
              ] as const
            ).map(([id, label]) => (
              <OptionButton
                key={id}
                selected={session.tone === id}
                onClick={() => patch({ tone: id })}
              >
                {label}
              </OptionButton>
            ))}
          </div>
        </>
      );
    case "communication":
      return (
        <>
          <h1 className="font-display mt-3 text-3xl font-light">How do you want to talk?</h1>
          <p className="mt-2 text-sm text-muted">
            BetterHelp lets you mix messaging, chat, phone, and video. We keep three options.
          </p>
          <div className="mt-6 grid gap-3">
            {(
              [
                ["message", "Mostly messaging", "Asynchronous, when campus is loud"],
                ["video", "Mostly live video", "Scheduled, face to face"],
                ["mix", "A mix", "Message during the week, live when it matters"],
              ] as const
            ).map(([id, label, hint]) => (
              <OptionButton
                key={id}
                selected={session.communication === id}
                hint={hint}
                onClick={() => patch({ communication: id })}
              >
                {label}
              </OptionButton>
            ))}
          </div>
        </>
      );
    case "preferences":
      return (
        <>
          <h1 className="font-display mt-3 text-3xl font-light">Any counselor preferences?</h1>
          <p className="mt-2 text-sm text-muted">Optional. Skip if you don’t mind.</p>
          <p className="mt-6 text-sm font-medium">Gender</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {(
              [
                ["any", "No preference"],
                ["woman", "Woman"],
                ["man", "Man"],
              ] as const
            ).map(([id, label]) => (
              <OptionButton
                key={id}
                selected={(session.prefGender ?? "any") === id}
                onClick={() => patch({ prefGender: id })}
              >
                {label}
              </OptionButton>
            ))}
          </div>
          <div className="mt-6 grid gap-3">
            <OptionButton
              selected={Boolean(session.lgbtqAffirming)}
              onClick={() => patch({ lgbtqAffirming: !session.lgbtqAffirming })}
            >
              LGBTQ+ affirming
            </OptionButton>
            <OptionButton
              selected={Boolean(session.faithSensitive)}
              onClick={() => patch({ faithSensitive: !session.faithSensitive })}
            >
              Faith-sensitive
            </OptionButton>
          </div>
        </>
      );
    case "account":
      return (
        <>
          <h1 className="font-display mt-3 text-3xl font-light">A name and school email</h1>
          <p className="mt-2 text-sm text-muted">
            No password. Nothing leaves this browser. A real product would verify the school domain.
          </p>
          <label className="mt-6 block text-sm font-medium">
            First name
            <input
              className="mt-2 w-full rounded-lg border border-line bg-white px-4 py-3 outline-none ring-leaf-deep/30 focus:ring-2"
              value={session.firstName ?? ""}
              onChange={(e) => patch({ firstName: e.target.value })}
              autoComplete="given-name"
            />
          </label>
          <label className="mt-4 block text-sm font-medium">
            School email
            <input
              type="email"
              className="mt-2 w-full rounded-lg border border-line bg-white px-4 py-3 outline-none ring-leaf-deep/30 focus:ring-2"
              value={session.email ?? ""}
              onChange={(e) => patch({ email: e.target.value })}
              placeholder="you@university.edu"
              autoComplete="email"
            />
          </label>
          <label className="mt-6 flex gap-3 text-sm leading-6 text-muted">
            <input
              type="checkbox"
              className="mt-1"
              checked={Boolean(session.consented)}
              onChange={(e) => patch({ consented: e.target.checked })}
            />
            <span>
              I understand this is a prototype, not therapy. In a real product, conversations would
              be confidential except where the law requires reporting imminent harm. I am not
              entering a clinical relationship today.
            </span>
          </label>
        </>
      );
    default:
      return null;
  }
}
