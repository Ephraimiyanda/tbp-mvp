"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/Logo";
import { Field, OptionButton, PrimaryButton, TextInput } from "@/components/Ui";
import { UniversitySelect } from "@/components/UniversitySelect";
import { WaveJoin } from "@/components/WaveDivider";
import { emptyDraft, loadDraft, saveDraft, type IntakeDraft } from "@/lib/intake-draft";
import { persistIntake } from "@/lib/persist-intake";
import { signupWithoutEmailVerification } from "@/lib/signup";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { CONCERNS } from "@/lib/types";

const STUDENT_STEPS = [
  "gender",
  "year",
  "concerns",
  "prior",
  "style",
  "tone",
  "communication",
  "preferences",
  "university",
  "consent",
  "account",
] as const;

const PEER_STEPS = ["year", "concerns", "university", "consent", "account"] as const;

type StepId = (typeof STUDENT_STEPS)[number];

export function GetStartedClient() {
  const router = useRouter();
  const params = useSearchParams();
  const intent = params.get("intent") === "peer" ? "peer" : "counseling";
  const [draft, setDraft] = useState<IntakeDraft>(emptyDraft);
  const [step, setStep] = useState(0);
  const [loggedIn, setLoggedIn] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  const steps = useMemo(
    () => (intent === "peer" ? PEER_STEPS : STUDENT_STEPS),
    [intent],
  );

  useEffect(() => {
    const loaded = loadDraft();
    setDraft(loaded);
    setFullName(loaded.fullName ?? "");
    if (!isSupabaseConfigured()) {
      setStep(firstIncomplete(intent === "peer" ? [...PEER_STEPS] : [...STUDENT_STEPS], loaded, false));
      setReady(true);
      return;
    }
    void (async () => {
      let signedIn = false;
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        signedIn = Boolean(data.user);
        setLoggedIn(signedIn);
        if (data.user) {
          const { data: intake } = await supabase
            .from("intakes")
            .select("id")
            .eq("student_id", data.user.id)
            .limit(1);
          if (intake?.length) {
            router.replace(intent === "peer" ? "/app/groups" : "/app");
            return;
          }
        }
      } catch {
        setLoggedIn(false);
      } finally {
        const all: readonly StepId[] = intent === "peer" ? PEER_STEPS : STUDENT_STEPS;
        // Preferences (and the rest of the questionnaire) only run during signup.
        // Logged-in users finishing a partial signup skip the account step only.
        const visible = signedIn ? all.filter((s) => s !== "account") : all;
        setStep(firstIncomplete(visible, loaded, signedIn));
        setReady(true);
      }
    })();
  }, [intent, router]);

  const visibleSteps = loggedIn ? steps.filter((s) => s !== "account") : steps;
  const current = (visibleSteps[step] ?? visibleSteps[0]) as StepId;
  const total = visibleSteps.length;

  function patch(partial: Partial<IntakeDraft>) {
    setDraft((d) => {
      const next = { ...d, ...partial };
      saveDraft(next);
      return next;
    });
  }

  function goNext() {
    if (current === "concerns" && draft.concerns.includes("crisis")) {
      router.push("/crisis");
      return;
    }
    if (step < total - 1) setStep((n) => n + 1);
  }

  function pick(partial: Partial<IntakeDraft>) {
    patch(partial);
    window.setTimeout(goNext, 160);
  }

  function canContinue() {
    switch (current) {
      case "gender":
        return Boolean(draft.gender);
      case "year":
        return Boolean(draft.year);
      case "concerns":
        return draft.concerns.length > 0;
      case "prior":
        return Boolean(draft.prior);
      case "style":
        return Boolean(draft.style);
      case "tone":
        return Boolean(draft.tone);
      case "communication":
        return Boolean(draft.communication);
      case "preferences":
        return true;
      case "university":
        return Boolean(draft.university?.trim());
      case "consent":
        return Boolean(draft.consented);
      case "account":
        return Boolean(fullName.trim() && email.includes("@") && password.length >= 8);
      default:
        return false;
    }
  }

  async function finish() {
    setError(null);
    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured yet.");
      return;
    }
    setBusy(true);
    const finalDraft = { ...draft, fullName: fullName || draft.fullName };
    saveDraft(finalDraft);
    try {
      const supabase = createClient();
      const { data: existing } = await supabase.auth.getUser();
      if (existing.user) {
        await persistIntake(supabase, existing.user.id, finalDraft);
        if (intent === "peer") router.push("/app/groups");
        else router.push("/matching");
        return;
      }
      const signedIn = await signupWithoutEmailVerification({
        email,
        password,
        fullName,
        role: "student",
      });
      const { data: auth } = await signedIn.auth.getUser();
      if (!auth.user) throw new Error("Account created but sign-in failed. Try logging in.");
      await persistIntake(signedIn, auth.user.id, finalDraft);
      if (intent === "peer") router.push("/app/groups");
      else router.push("/matching");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not finish onboarding");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-full flex-col bg-white">
        <FunnelBar progress={0} />
      </div>
    );
  }

  const ctaLabel = (() => {
    if (busy) return current === "account" ? "Creating…" : "Saving…";
    if (current === "account") return "Create account";
    if (current === "consent" && loggedIn) return intent === "peer" ? "See groups" : "Find a professional";
    return "Continue";
  })();

  return (
    <div className="flex min-h-full flex-col bg-white">
      <FunnelBar progress={((step + 1) / total) * 100} />
      <main className="flex flex-1 flex-col items-center px-5 py-10">
        <div className="my-auto flex w-full max-w-lg flex-col items-center text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-ok">
            {intent === "peer" ? "Peer support signup" : "Student signup"} · {step + 1} of {total}
          </p>
          <StepBody
            step={current}
            draft={draft}
            patch={patch}
            pick={pick}
            fullName={fullName}
            email={email}
            password={password}
            setFullName={setFullName}
            setEmail={setEmail}
            setPassword={setPassword}
          />
          {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
          <div className="mt-8 flex w-full items-center justify-between">
            {step > 0 ? (
              <button
                type="button"
                className="cursor-pointer text-sm font-medium text-muted hover:text-navy"
                onClick={() => setStep((n) => n - 1)}
              >
                Back
              </button>
            ) : (
              <Link href="/" className="text-sm font-medium text-muted">
                Cancel
              </Link>
            )}
            {current === "account" ||
            current === "consent" ||
            current === "concerns" ||
            current === "university" ||
            current === "preferences" ? (
              <PrimaryButton
                onClick={current === "account" || (current === "consent" && loggedIn) ? finish : goNext}
                disabled={!canContinue() || busy}
              >
                {ctaLabel}
              </PrimaryButton>
            ) : (
              <span className="text-sm text-muted">Select an answer to continue</span>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function FunnelBar({ progress }: { progress: number }) {
  return (
    <>
      <header className="bg-navy text-paper">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
          <Logo inverted />
          <Link href="/login" className="cursor-pointer text-sm font-medium text-paper/80 hover:text-paper">
            Log in
          </Link>
        </div>
        <div className="mx-auto max-w-3xl px-5 pb-3">
          <div className="h-1 overflow-hidden rounded-full bg-white/15">
            <div className="progress-blend h-1 rounded-full transition-[width] duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </header>
      <WaveJoin from="navy" to="white" />
    </>
  );
}

function firstIncomplete(steps: readonly StepId[], draft: IntakeDraft, loggedIn: boolean) {
  const idx = steps.findIndex((id) => !stepComplete(id, draft, loggedIn));
  return idx === -1 ? Math.max(0, steps.length - 1) : idx;
}

function stepComplete(id: StepId, draft: IntakeDraft, loggedIn: boolean) {
  switch (id) {
    case "gender":
      return Boolean(draft.gender);
    case "year":
      return Boolean(draft.year);
    case "concerns":
      return draft.concerns.length > 0;
    case "prior":
      return Boolean(draft.prior);
    case "style":
      return Boolean(draft.style);
    case "tone":
      return Boolean(draft.tone);
    case "communication":
      return Boolean(draft.communication);
    case "preferences":
      return true;
    case "university":
      return Boolean(draft.university?.trim());
    case "consent":
      return Boolean(draft.consented);
    case "account":
      return loggedIn;
    default:
      return false;
  }
}

function StepBody({
  step,
  draft,
  patch,
  pick,
  fullName,
  email,
  password,
  setFullName,
  setEmail,
  setPassword,
}: {
  step: StepId;
  draft: IntakeDraft;
  patch: (p: Partial<IntakeDraft>) => void;
  pick: (p: Partial<IntakeDraft>) => void;
  fullName: string;
  email: string;
  password: string;
  setFullName: (v: string) => void;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
}) {
  switch (step) {
    case "gender":
      return (
        <>
          <h1 className="font-display mt-3 text-3xl font-light text-navy">How do you identify?</h1>
          <p className="mt-2 text-sm text-muted">
            We ask so we can honor a gender preference for your professional if you have one.
          </p>
          <div className="mt-6 grid w-full gap-3">
            {[
              ["woman", "Woman"],
              ["man", "Man"],
              ["nonbinary", "Non-binary"],
              ["unspecified", "Prefer not to say"],
            ].map(([id, label]) => (
              <OptionButton key={id} selected={draft.gender === id} onClick={() => pick({ gender: id })}>
                {label}
              </OptionButton>
            ))}
          </div>
        </>
      );
    case "year":
      return (
        <>
          <h1 className="font-display mt-3 text-3xl font-light text-navy">What year are you?</h1>
          <p className="mt-2 text-sm text-muted">Campus stand-in for an age question — year of study is more useful here.</p>
          <div className="mt-6 grid w-full gap-3">
            {["100-level", "200-level", "300-level", "400-level", "Postgraduate"].map((y) => (
              <OptionButton key={y} selected={draft.year === y} onClick={() => pick({ year: y })}>
                {y}
              </OptionButton>
            ))}
          </div>
        </>
      );
    case "concerns":
      return (
        <>
          <h1 className="font-display mt-3 text-3xl font-light text-navy">What’s going on?</h1>
          <p className="mt-2 text-sm text-muted">Pick as many as you need. This sets your care-plan length.</p>
          <div className="mt-6 grid w-full gap-3">
            {CONCERNS.map((c) => (
              <OptionButton
                key={c.id}
                selected={draft.concerns.includes(c.id)}
                onClick={() =>
                  patch({
                    concerns: draft.concerns.includes(c.id)
                      ? draft.concerns.filter((x) => x !== c.id)
                      : [...draft.concerns.filter((x) => x !== "crisis"), c.id],
                  })
                }
              >
                {c.label}
              </OptionButton>
            ))}
            <OptionButton
              selected={draft.concerns.includes("crisis")}
              onClick={() => patch({ concerns: draft.concerns.includes("crisis") ? [] : ["crisis"] })}
            >
              I’m in crisis right now
            </OptionButton>
          </div>
        </>
      );
    case "prior":
      return (
        <>
          <h1 className="font-display mt-3 text-3xl font-light text-navy">Have you been in counseling before?</h1>
          <div className="mt-6 grid w-full gap-3">
            {[
              ["No — this would be new", "No — this would be new"],
              ["Yes", "Yes"],
              ["Not sure / informal support only", "Not sure / informal support only"],
            ].map(([id, label]) => (
              <OptionButton key={id} selected={draft.prior === id} onClick={() => pick({ prior: id })}>
                {label}
              </OptionButton>
            ))}
          </div>
        </>
      );
    case "style":
      return (
        <>
          <h1 className="font-display mt-3 text-3xl font-light text-navy">What do you want from a professional?</h1>
          <div className="mt-6 grid w-full gap-3">
            {[
              ["listens", "Mostly listens and reflects"],
              ["skills", "Teaches skills I can use"],
              ["challenges", "Challenges me when I’m stuck"],
            ].map(([id, label]) => (
              <OptionButton key={id} selected={draft.style === id} onClick={() => pick({ style: id })}>
                {label}
              </OptionButton>
            ))}
          </div>
        </>
      );
    case "tone":
      return (
        <>
          <h1 className="font-display mt-3 text-3xl font-light text-navy">Gentle or direct?</h1>
          <div className="mt-6 grid w-full gap-3 sm:grid-cols-2">
            {["gentle", "direct"].map((t) => (
              <OptionButton key={t} selected={draft.tone === t} onClick={() => pick({ tone: t })}>
                {t === "gentle" ? "Gentle" : "Direct"}
              </OptionButton>
            ))}
          </div>
        </>
      );
    case "communication":
      return (
        <>
          <h1 className="font-display mt-3 text-3xl font-light text-navy">How do you want to talk?</h1>
          <p className="mt-2 text-sm text-muted">
            Live sessions are Google Meet. Messaging and mix tell your professional how to pace the week.
          </p>
          <div className="mt-6 grid w-full gap-3">
            {[
              ["message", "Mostly messaging", "Asynchronous, between live sessions"],
              ["video", "Mostly live video", "Scheduled Meet calls"],
              ["mix", "A mix", "Message during the week, Meet when it matters"],
            ].map(([id, label, hint]) => (
              <OptionButton
                key={id}
                selected={draft.communication === id}
                onClick={() => pick({ communication: id })}
              >
                <span className="block font-medium">{label}</span>
                <span className="mt-1 block text-sm text-muted">{hint}</span>
              </OptionButton>
            ))}
          </div>
        </>
      );
    case "preferences":
      return (
        <>
          <h1 className="font-display mt-3 text-3xl font-light text-navy">Any professional preferences?</h1>
          <p className="mt-2 text-sm text-muted">Optional. Skip if you don’t mind.</p>
          <p className="mt-6 text-sm font-medium">Gender</p>
          <div className="mt-3 grid w-full gap-3 sm:grid-cols-3">
            {[
              ["any", "No preference"],
              ["woman", "Woman"],
              ["man", "Man"],
            ].map(([id, label]) => (
              <OptionButton
                key={id}
                selected={(draft.prefGender ?? "any") === id}
                onClick={() => patch({ prefGender: id })}
              >
                {label}
              </OptionButton>
            ))}
          </div>
          <div className="mt-6 grid w-full gap-3">
            <OptionButton selected={Boolean(draft.lgbtq)} onClick={() => patch({ lgbtq: !draft.lgbtq })}>
              LGBTQ+ affirming
            </OptionButton>
            <OptionButton selected={Boolean(draft.faith)} onClick={() => patch({ faith: !draft.faith })}>
              Faith-sensitive
            </OptionButton>
          </div>
        </>
      );
    case "university":
      return (
        <>
          <h1 className="font-display mt-3 text-3xl font-light text-navy">Which campus?</h1>
          <p className="mt-2 text-sm text-muted">Search the list of universities in Nigeria.</p>
          <div className="mt-6 w-full">
            <Field label="University">
              <UniversitySelect
                value={draft.university ?? ""}
                onChange={(university) => patch({ university })}
              />
            </Field>
          </div>
        </>
      );
    case "consent":
      return (
        <>
          <h1 className="font-display mt-3 text-3xl font-light text-navy">What stays private</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Your intake, session notes, and Meet links are visible only to you and the professional you
            subscribe to. Platform operators are not granted that access. The exception is imminent
            harm, where the law may require a report. Myalo is not emergency care.
          </p>
          <label className="mt-6 flex w-full cursor-pointer gap-3 text-left text-sm leading-6">
            <input
              type="checkbox"
              className="mt-1"
              checked={Boolean(draft.consented)}
              onChange={(e) => patch({ consented: e.target.checked })}
            />
            I understand, and I want to continue.
          </label>
        </>
      );
    case "account":
      return (
        <>
          <h1 className="font-display mt-3 text-3xl font-light text-navy">Create your account</h1>
          <p className="mt-2 text-sm text-muted">
            That’s the questionnaire done. Add your name and email to finish signing up.
          </p>
          <p className="mt-2 text-sm">
            Already have an account?{" "}
            <Link href="/login?next=/signup" className="font-semibold text-navy underline">
              Log in
            </Link>
          </p>
          <div className="mt-6 w-full space-y-4 text-left">
            <Field label="First name">
              <TextInput value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="given-name" />
            </Field>
            <Field label="Email">
              <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </Field>
            <Field label="Password">
              <TextInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                autoComplete="new-password"
              />
            </Field>
          </div>
        </>
      );
    default:
      return null;
  }
}
