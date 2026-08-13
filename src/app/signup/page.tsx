"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthShell } from "@/components/SiteChrome";
import { Field, PrimaryButton, TextInput } from "@/components/Ui";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [role, setRole] = useState<"student" | "professional">(
    params.get("role") === "professional" ? "professional" : "student",
  );
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
          data: { full_name: fullName, role },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${
            role === "professional" ? "/onboarding" : "/get-started"
          }`,
        },
      });
      if (signError) throw signError;
      const { data } = await supabase.auth.getSession();
      if (data.session) router.push(role === "professional" ? "/onboarding" : "/get-started");
      else router.push("/login?checkemail=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign up");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <h1 className="font-display text-3xl font-light">
        {role === "professional" ? "Join as a professional" : "Create an account"}
      </h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        {role === "professional"
          ? "Create your account, then finish a short profile. Students see you after they complete intake and subscribe."
          : "Students usually start with a few questions first — it only takes a couple of minutes."}
      </p>
      {role === "student" ? (
        <p className="mt-3 text-sm">
          <Link className="font-semibold text-navy underline" href="/get-started">
            Start the questionnaire instead
          </Link>
        </p>
      ) : null}
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {(["student", "professional"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`rounded-full px-3 py-2 text-sm capitalize ${
                role === r ? "bg-navy text-paper" : "border border-line bg-white text-ink"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
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
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-navy underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
