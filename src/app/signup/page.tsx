"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { GetStartedClient } from "@/components/GetStartedClient";
import { AuthShell } from "@/components/SiteChrome";
import { Field, PrimaryButton, TextInput } from "@/components/Ui";
import { authCallbackUrl } from "@/lib/site-url";
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
  const [awaitingEmail, setAwaitingEmail] = useState(false);

  useEffect(() => {
    if (!awaitingEmail) return;
    const timer = window.setTimeout(() => router.replace("/login?checkemail=1"), 2800);
    return () => window.clearTimeout(timer);
  }, [awaitingEmail, router]);

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
          emailRedirectTo: authCallbackUrl(),
        },
      });
      if (signError) throw signError;
      const { data } = await supabase.auth.getSession();
      if (data.session) await supabase.auth.signOut();
      setAwaitingEmail(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign up");
    } finally {
      setBusy(false);
    }
  }

  if (awaitingEmail) {
    return (
      <AuthShell>
        <h1 className="font-display text-3xl font-light text-navy">Confirm your email</h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-muted">
          We sent a confirmation link to {email}. Open it to finish creating your account.
        </p>
        <p className="mt-6 text-sm text-muted">Taking you to log in…</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 className="font-display text-3xl font-light text-navy">Join as a professional</h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        Create your account, then finish a short profile. Students see you after they complete intake
        and subscribe.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4 text-left">
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
          {busy ? "Creating…" : "Create account"}
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
    <Suspense fallback={<div className="min-h-full bg-white px-5 py-16 text-center text-muted">Loading onboarding…</div>}>
      <SignupSwitch />
    </Suspense>
  );
}
