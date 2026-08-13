"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Logo } from "@/components/Logo";
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
          emailRedirectTo: `${window.location.origin}/auth/callback`,
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
    <div className="flex min-h-full flex-col bg-navy text-paper">
      <header className="mx-auto flex h-16 w-full max-w-md items-center px-5">
        <Logo inverted />
      </header>
      <main className="mx-auto w-full max-w-md flex-1 px-5 py-10">
        <h1 className="font-display text-3xl font-light">Create your Myalo account</h1>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(["student", "professional"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`rounded-full px-3 py-2 text-sm capitalize ${
                  role === r ? "bg-clay text-paper" : "bg-navy-soft text-paper/80"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <Field label="Full name">
            <TextInput value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </Field>
          <Field label="Email">
            <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="Password">
            <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </Field>
          {error ? <p className="text-sm text-clay-soft">{error}</p> : null}
          <PrimaryButton type="submit" disabled={busy} className="w-full">
            {busy ? "Creating…" : "Continue"}
          </PrimaryButton>
        </form>
        <p className="mt-6 text-sm text-paper/60">
          Already have an account?{" "}
          <Link href="/login" className="text-clay-soft">
            Log in
          </Link>
        </p>
      </main>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
