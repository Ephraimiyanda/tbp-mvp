import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type Body = { mood?: number; note?: string | null };

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Groups API is not configured" }, { status: 503 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const mood = Number(body.mood);
  if (!Number.isFinite(mood) || mood < 1 || mood > 5) {
    return NextResponse.json({ error: "Mood must be 1–5" }, { status: 400 });
  }

  const { id } = await context.params;
  try {
    const admin = createAdminClient();
    const { data: membership } = await admin
      .from("group_members")
      .select("id")
      .eq("group_id", id)
      .eq("profile_id", user.id)
      .maybeSingle();
    if (!membership) {
      return NextResponse.json({ error: "Join the group before checking in" }, { status: 403 });
    }

    const { error } = await admin.from("group_checkins").insert({
      group_id: id,
      profile_id: user.id,
      mood,
      note: body.note?.trim() || null,
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not save check-in" },
      { status: 500 },
    );
  }
}
