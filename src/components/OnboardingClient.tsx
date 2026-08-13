"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { Field, OptionButton, PrimaryButton, TextArea, TextInput } from "@/components/Ui";
import { WaveJoin } from "@/components/WaveDivider";
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
        if (data?.role === "student") {
          const { data: intake } = await supabase
            .from("intakes")
            .select("id")
            .eq("student_id", data.id)
            .limit(1);
          router.replace(intake?.length ? "/app" : "/signup");
          return;
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

  if (profile.role === "student") {
    return <div className="min-h-full bg-paper px-5 py-16 text-muted">Taking you to the questionnaire…</div>;
  }

  return <ProOnboarding profile={profile} onError={setError} error={error} />;
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
    <Shell>
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

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-white">
      <header className="bg-navy text-paper">
        <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-5">
          <Logo inverted />
          <p className="text-xs text-paper/70">Professional profile</p>
        </div>
      </header>
      <WaveJoin from="navy" to="white" />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-5 py-10">
        <div className="w-full">{children}</div>
      </main>
    </div>
  );
}
