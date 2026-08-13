import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
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

  const { id } = await context.params;
  try {
    const admin = createAdminClient();
    const { data: group, error } = await admin.from("groups").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    const { data: members, error: memberError } = await admin
      .from("group_members")
      .select("*")
      .eq("group_id", id);
    if (memberError) throw memberError;

    const list = members ?? [];
    const me = list.find((row) => row.profile_id === user.id);
    let checkins: unknown[] = [];
    if (me) {
      const { data: c, error: checkinError } = await admin
        .from("group_checkins")
        .select("*")
        .eq("group_id", id)
        .order("created_at", { ascending: true });
      if (checkinError) throw checkinError;
      checkins = c ?? [];
    }

    return NextResponse.json({
      group,
      members: list,
      checkins,
      mine: Boolean(me),
      admin: me?.role === "admin",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load group" },
      { status: 500 },
    );
  }
}
