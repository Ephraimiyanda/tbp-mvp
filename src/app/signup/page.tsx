"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { GetStartedClient } from "@/components/GetStartedClient";
import { AuthShell } from "@/components/SiteChrome";
import { Field, PrimaryButton, TextInput } from "@/components/Ui";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

function SignupSwitch() {
  const params = useSearchParams();
  if (params.get("role") === "professional") return <ProfessionalSignup />;
  return <GetStartedClient />;
}

function ProfessionalSignup() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and ANON_KEY to .env.local.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const { error: signError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role: "professional" },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        },
      });
      if (signError) throw signError;
      const { data } = await supabase.auth.getSession();
      if (data.session) router.push("/onboarding");
      else router.push("/login?checkemail=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign up");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <h1 className="font-display text-3xl font-light text-navy">Join as a professional</h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        Create your account, then finish a short profile. Students see you after they complete intake
        and subscribe.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Field label="Full name">
          <TextInput value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" />
        </Field>
        <Field label="Email">
          <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </Field>
        <Field label="Password">
          <TextInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </Field>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <PrimaryButton type="submit" disabled={busy} className="w-full">
          {busy ? "Creating…" : "Continue"}
        </PrimaryButton>
      </form>
      <p className="mt-6 text-sm text-muted">
        Students sign up through the questionnaire.{" "}
        <Link href="/signup" className="font-semibold text-navy underline">
          Student signup
        </Link>
        {" · "}
        <Link href="/login" className="font-semibold text-navy underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="calm-wash min-h-full px-5 py-16 text-muted">Loading onboarding…</div>
      }
    >
      <SignupSwitch />
    </Suspense>
  );
}
