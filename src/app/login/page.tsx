"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthShell } from "@/components/SiteChrome";
import { Field, PrimaryButton, TextInput } from "@/components/Ui";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured yet.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const { error: signError } = await supabase.auth.signInWithPassword({ email, password });
      if (signError) throw signError;
      const next = params.get("next") || "/app";
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <h1 className="font-display text-3xl font-light text-navy">Log in</h1>
      {params.get("checkemail") ? (
        <p className="mt-3 text-sm text-ok">Check your email to confirm the account, then log in.</p>
      ) : (
        <p className="mt-2 text-sm text-muted">Welcome back. Your match, groups, and sessions are here.</p>
      )}
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Field label="Email">
          <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </Field>
        <Field label="Password">
          <TextInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </Field>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <PrimaryButton type="submit" disabled={busy} className="w-full">
          {busy ? "Signing in…" : "Log in"}
        </PrimaryButton>
      </form>
      <p className="mt-6 text-sm text-muted">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-navy underline">
          Sign up
        </Link>
        {" · "}
        <Link href="/signup?role=professional" className="font-semibold text-navy underline">
          Professional signup
        </Link>
      </p>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
