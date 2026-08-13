import { createClient } from "@/lib/supabase/client";

type SignupRole = "student" | "professional";

/**
 * Creates a confirmed account (no email verification) then signs the browser in.
 * Requires SUPABASE_SERVICE_ROLE_KEY on the server.
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
  const payload = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new Error(payload.error || "Could not create account");
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  if (error) throw error;
  return supabase;
}
