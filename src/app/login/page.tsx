"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Logo } from "@/components/Logo";
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
      const next = params.get("next") || "/onboarding";
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-navy text-paper">
      <header className="mx-auto flex h-16 w-full max-w-md items-center px-5">
        <Logo inverted />
      </header>
      <main className="mx-auto w-full max-w-md flex-1 px-5 py-10">
        <h1 className="font-display text-3xl font-light">Log in</h1>
        {params.get("checkemail") ? (
          <p className="mt-3 text-sm text-clay-soft">Check your email to confirm the account, then log in.</p>
        ) : null}
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <Field label="Email">
            <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="Password">
            <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          {error ? <p className="text-sm text-clay-soft">{error}</p> : null}
          <PrimaryButton type="submit" disabled={busy} className="w-full">
            {busy ? "Signing in…" : "Log in"}
          </PrimaryButton>
        </form>
        <p className="mt-6 text-sm text-paper/60">
          New here?{" "}
          <Link href="/signup" className="text-clay-soft">
            Create an account
          </Link>
        </p>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
