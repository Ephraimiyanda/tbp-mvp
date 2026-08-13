import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(
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
    const { data: group, error: groupError } = await admin
      .from("groups")
      .select("id, member_cap")
      .eq("id", id)
      .maybeSingle();
    if (groupError) throw groupError;
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    const { count, error: countError } = await admin
      .from("group_members")
      .select("*", { count: "exact", head: true })
      .eq("group_id", id);
    if (countError) throw countError;
    if ((count ?? 0) >= (group.member_cap as number)) {
      return NextResponse.json({ error: "This group is full" }, { status: 400 });
    }

    const { data: existing } = await admin
      .from("group_members")
      .select("id")
      .eq("group_id", id)
      .eq("profile_id", user.id)
      .maybeSingle();
    if (existing) return NextResponse.json({ ok: true, already: true });

    const { error: insertError } = await admin.from("group_members").insert({
      group_id: id,
      profile_id: user.id,
      role: "member",
    });
    if (insertError) throw insertError;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not join group" },
      { status: 500 },
    );
  }
}
