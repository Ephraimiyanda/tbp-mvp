"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { Field, OptionButton, PrimaryButton, TextArea, TextInput } from "@/components/Ui";
import { createClient } from "@/lib/supabase/client";
import { CONCERNS, type Profile } from "@/lib/types";

export function OnboardingClient() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const supabase = createClient();
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) {
          router.replace("/login");
          return;
        }
        const { data } = await supabase.from("profiles").select("*").eq("id", auth.user.id).single();
        setProfile(data as Profile);
        if (data?.role === "student" && data.consented_at) {
          const { data: intake } = await supabase.from("intakes").select("id").eq("student_id", data.id).limit(1);
          if (intake?.length) router.replace("/app");
        }
        if (data?.role === "professional" && data.consented_at) {
          const { data: pro } = await supabase
            .from("professionals")
            .select("credentials")
            .eq("profile_id", data.id)
            .single();
          if (pro?.credentials) router.replace("/pro");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load profile");
      }
    })();
  }, [router]);

  if (!profile) {
    return <div className="min-h-full bg-paper px-5 py-16 text-muted">{error ?? "Loading…"}</div>;
  }

  return profile.role === "professional" ? (
    <ProOnboarding profile={profile} onError={setError} error={error} />
  ) : (
    <StudentOnboarding profile={profile} onError={setError} error={error} />
  );
}

function StudentOnboarding({
  profile,
  error,
  onError,
}: {
  profile: Profile;
  error: string | null;
  onError: (e: string | null) => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [university, setUniversity] = useState(profile.university ?? "");
  const [year, setYear] = useState(profile.year_of_study ?? "");
  const [concerns, setConcerns] = useState<string[]>([]);
  const [prior, setPrior] = useState("");
  const [style, setStyle] = useState("");
  const [tone, setTone] = useState("");
  const [prefGender, setPrefGender] = useState("any");
  const [lgbtq, setLgbtq] = useState(false);
  const [faith, setFaith] = useState(false);
  const [busy, setBusy] = useState(false);

  async function finish() {
    onError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      await supabase
        .from("profiles")
        .update({
          university,
          year_of_study: year,
          consented_at: new Date().toISOString(),
        })
        .eq("id", profile.id);
      const { error: intakeError } = await supabase.from("intakes").insert({
        student_id: profile.id,
        concerns,
        prior_counseling: prior,
        counselor_style: style,
        tone,
        pref_gender: prefGender,
        lgbtq_affirming: lgbtq,
        faith_sensitive: faith,
        answers: {},
      });
      if (intakeError) throw intakeError;
      router.push("/app/match");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not save intake");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell step={step} total={5} title="Student intake">
      {step === 0 ? (
        <>
          <h1 className="font-display text-3xl font-light">What stays private</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Your intake, session notes, and Meet links are visible only to you and the professional
            you subscribe to. Myalo staff are not granted that access. The exception is imminent
            harm, where the law may require a report. This is not emergency care.
          </p>
          <div className="mt-8">
            <PrimaryButton onClick={() => setStep(1)}>I understand — continue</PrimaryButton>
          </div>
        </>
      ) : null}
      {step === 1 ? (
        <>
          <h1 className="font-display text-3xl font-light">Campus</h1>
          <div className="mt-6 space-y-4">
            <Field label="University">
              <TextInput value={university} onChange={(e) => setUniversity(e.target.value)} required />
            </Field>
            <p className="text-sm font-medium">Year</p>
            <div className="grid gap-2">
              {["100-level", "200-level", "300-level", "400-level", "Postgraduate"].map((y) => (
                <OptionButton key={y} selected={year === y} onClick={() => setYear(y)}>
                  {y}
                </OptionButton>
              ))}
            </div>
          </div>
        </>
      ) : null}
      {step === 2 ? (
        <>
          <h1 className="font-display text-3xl font-light">What’s going on?</h1>
          <p className="mt-2 text-sm text-muted">This sets the length of your care plan.</p>
          {concerns.includes("crisis") ? (
            <p className="mt-4 text-sm text-danger">
              If you are in crisis, go to campus emergency or the crisis page — Myalo will not match you.
            </p>
          ) : null}
          <div className="mt-6 grid gap-2">
            {CONCERNS.map((c) => (
              <OptionButton
                key={c.id}
                selected={concerns.includes(c.id)}
                onClick={() =>
                  setConcerns((list) =>
                    list.includes(c.id) ? list.filter((x) => x !== c.id) : [...list, c.id],
                  )
                }
              >
                {c.label}
              </OptionButton>
            ))}
            <OptionButton
              selected={concerns.includes("crisis")}
              onClick={() => setConcerns((list) => (list.includes("crisis") ? [] : ["crisis"]))}
            >
              I’m in crisis right now
            </OptionButton>
          </div>
        </>
      ) : null}
      {step === 3 ? (
        <>
          <h1 className="font-display text-3xl font-light">How you like to work</h1>
          <div className="mt-6 space-y-3">
            {["No — this would be new", "Yes", "Not sure"].map((p) => (
              <OptionButton key={p} selected={prior === p} onClick={() => setPrior(p)}>
                {p}
              </OptionButton>
            ))}
          </div>
          <p className="mt-6 text-sm font-medium">From a professional, I want someone who</p>
          <div className="mt-3 space-y-3">
            {[
              ["listens", "Mostly listens"],
              ["skills", "Teaches skills"],
              ["challenges", "Challenges me"],
            ].map(([id, label]) => (
              <OptionButton key={id} selected={style === id} onClick={() => setStyle(id)}>
                {label}
              </OptionButton>
            ))}
          </div>
          <p className="mt-6 text-sm font-medium">Tone</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {["gentle", "direct"].map((t) => (
              <OptionButton key={t} selected={tone === t} onClick={() => setTone(t)}>
                {t}
              </OptionButton>
            ))}
          </div>
        </>
      ) : null}
      {step === 4 ? (
        <>
          <h1 className="font-display text-3xl font-light">Optional preferences</h1>
          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            {["any", "woman", "man"].map((g) => (
              <OptionButton key={g} selected={prefGender === g} onClick={() => setPrefGender(g)}>
                {g === "any" ? "No preference" : g}
              </OptionButton>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            <OptionButton selected={lgbtq} onClick={() => setLgbtq(!lgbtq)}>
              LGBTQ+ affirming
            </OptionButton>
            <OptionButton selected={faith} onClick={() => setFaith(!faith)}>
              Faith-sensitive
            </OptionButton>
          </div>
        </>
      ) : null}
      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
      {step > 0 ? (
        <div className="mt-8 flex justify-between">
          <button type="button" className="text-sm text-muted" onClick={() => setStep((s) => s - 1)}>
            Back
          </button>
          {step < 4 ? (
            <PrimaryButton
              onClick={() => {
                if (step === 2 && concerns.includes("crisis")) {
                  router.push("/crisis");
                  return;
                }
                setStep((s) => s + 1);
              }}
              disabled={step === 1 && !year}
            >
              Continue
            </PrimaryButton>
          ) : (
            <PrimaryButton onClick={finish} disabled={busy || !concerns.length}>
              {busy ? "Saving…" : "Find a professional"}
            </PrimaryButton>
          )}
        </div>
      ) : null}
    </Shell>
  );
}

function ProOnboarding({
  profile,
  error,
  onError,
}: {
  profile: Profile;
  error: string | null;
  onError: (e: string | null) => void;
}) {
  const router = useRouter();
  const [credentials, setCredentials] = useState("");
  const [bio, setBio] = useState("");
  const [approach, setApproach] = useState("");
  const [meet, setMeet] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [tone, setTone] = useState("gentle");
  const [busy, setBusy] = useState(false);

  async function finish() {
    onError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      await supabase
        .from("profiles")
        .update({ consented_at: new Date().toISOString() })
        .eq("id", profile.id);
      const { error: proError } = await supabase
        .from("professionals")
        .update({
          credentials,
          bio,
          approach,
          specialties,
          tone,
          default_meet_url: meet || null,
        })
        .eq("profile_id", profile.id);
      if (proError) throw proError;
      router.push("/pro");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell step={1} total={1} title="Professional profile">
      <h1 className="font-display text-3xl font-light">How students will see you</h1>
      <p className="mt-2 text-sm text-muted">
        Session notes you write stay yours. Students never see them. Paste a standing Google Meet
        link if you do not use Calendar automation.
      </p>
      <div className="mt-6 space-y-4">
        <Field label="Credentials">
          <TextInput value={credentials} onChange={(e) => setCredentials(e.target.value)} placeholder="LPC · 8 years" />
        </Field>
        <Field label="Bio">
          <TextArea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
        </Field>
        <Field label="Approach">
          <TextArea rows={3} value={approach} onChange={(e) => setApproach(e.target.value)} />
        </Field>
        <Field label="Default Google Meet URL (optional)">
          <TextInput value={meet} onChange={(e) => setMeet(e.target.value)} placeholder="https://meet.google.com/…" />
        </Field>
        <p className="text-sm font-medium">Specialties</p>
        <div className="grid gap-2">
          {CONCERNS.map((c) => (
            <OptionButton
              key={c.id}
              selected={specialties.includes(c.id)}
              onClick={() =>
                setSpecialties((list) =>
                  list.includes(c.id) ? list.filter((x) => x !== c.id) : [...list, c.id],
                )
              }
            >
              {c.label}
            </OptionButton>
          ))}
        </div>
        <p className="text-sm font-medium">Tone</p>
        <div className="grid grid-cols-2 gap-2">
          {["gentle", "direct"].map((t) => (
            <OptionButton key={t} selected={tone === t} onClick={() => setTone(t)}>
              {t}
            </OptionButton>
          ))}
        </div>
      </div>
      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
      <div className="mt-8">
        <PrimaryButton onClick={finish} disabled={busy || !credentials || !bio}>
          {busy ? "Saving…" : "Go to dashboard"}
        </PrimaryButton>
      </div>
    </Shell>
  );
}

function Shell({
  children,
  step,
  total,
  title,
}: {
  children: ReactNode;
  step: number;
  total: number;
  title: string;
}) {
  return (
    <div className="flex min-h-full flex-col bg-paper">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-5">
          <Logo />
          <p className="text-xs text-muted">{title}</p>
        </div>
        <div className="h-1 bg-line">
          <div className="h-1 bg-clay" style={{ width: `${((step + 1) / total) * 100}%` }} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-xl flex-1 px-5 py-10">{children}</main>
    </div>
  );
}
