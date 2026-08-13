import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type Body = {
  full_name?: string;
  role?: "student" | "professional";
};

/**
 * Ensures the signed-in auth user has a public.profiles row.
 * Needed when the on_auth_user_created trigger did not run (or failed).
 */
export async function POST(request: Request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not configured." },
      { status: 503 },
    );
  }

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    body = {};
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const role =
    body.role === "professional" || user.user_metadata?.role === "professional"
      ? "professional"
      : "student";
  const fullName =
    body.full_name?.trim() ||
    (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "") ||
    user.email?.split("@")[0] ||
    "";

  try {
    const admin = createAdminClient();
    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: user.id,
        email: user.email,
        full_name: fullName,
        role,
      },
      { onConflict: "id" },
    );
    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    if (role === "professional") {
      const { error: proError } = await admin.from("professionals").upsert(
        { profile_id: user.id },
        { onConflict: "profile_id" },
      );
      if (proError) {
        return NextResponse.json({ error: proError.message }, { status: 400 });
      }
    }

    return NextResponse.json({ id: user.id, role });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not ensure profile" },
      { status: 500 },
    );
  }
}
