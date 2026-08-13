import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Body = {
  email?: string;
  password?: string;
  full_name?: string;
  role?: "student" | "professional";
};

async function ensureProfile(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  email: string,
  fullName: string,
  role: "student" | "professional",
) {
  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      email,
      full_name: fullName || email.split("@")[0] || "",
      role,
    },
    { onConflict: "id" },
  );
  if (profileError) throw profileError;

  if (role === "professional") {
    const { error: proError } = await admin.from("professionals").upsert(
      { profile_id: userId },
      { onConflict: "profile_id" },
    );
    if (proError) throw proError;
  }
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const fullName = body.full_name?.trim() ?? "";
  const role = body.role === "professional" ? "professional" : "student";

  if (!email.includes("@") || password.length < 8) {
    return NextResponse.json(
      { error: "Use a valid email and a password of at least 8 characters." },
      { status: 400 },
    );
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      {
        fallback: true,
        error: "SUPABASE_SERVICE_ROLE_KEY is not set. Falling back to client signup.",
      },
      { status: 503 },
    );
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        return NextResponse.json(
          { error: "That email already has an account. Log in instead." },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const userId = data.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "User created without an id" }, { status: 500 });
    }

    // Trigger may be missing on some projects; create the row explicitly.
    await ensureProfile(admin, userId, email, fullName, role);

    return NextResponse.json({ id: userId, email });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not create account" },
      { status: 500 },
    );
  }
}
