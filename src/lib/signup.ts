import { createClient } from "@/lib/supabase/client";

type SignupRole = "student" | "professional";

const CONFIRM_HINT =
  "Email confirmation is still required in Supabase. Turn off Authentication → Providers → Email → Confirm email, or set SUPABASE_SERVICE_ROLE_KEY on Vercel and redeploy.";

/**
 * Creates an account and signs the browser in with no confirmation email.
 * Prefers the service-role API (auto-confirms). Falls back to client signUp
 * when Confirm email is already off in Supabase.
 */
export async function signupWithoutEmailVerification(input: {
  email: string;
  password: string;
  fullName: string;
  role: SignupRole;
}) {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      full_name: input.fullName,
      role: input.role,
    }),
  });
  const payload = (await res.json().catch(() => ({}))) as {
    error?: string;
    fallback?: boolean;
  };

  if (res.ok) {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });
    if (error) throw error;
    return supabase;
  }

  if (res.status === 503 || payload.fallback) {
    return clientSignupFallback(input);
  }

  throw new Error(payload.error || "Could not create account");
}

async function clientSignupFallback(input: {
  email: string;
  password: string;
  fullName: string;
  role: SignupRole;
}) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: { full_name: input.fullName, role: input.role },
    },
  });
  if (error) throw error;

  if (data.session) return supabase;

  const { data: signedIn, error: signInError } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  if (signInError || !signedIn.session) {
    throw new Error(CONFIRM_HINT);
  }
  return supabase;
}
