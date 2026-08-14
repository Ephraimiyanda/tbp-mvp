import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    student_id?: string;
    session_type?: "chat" | "video";
    meet_url?: string | null;
  };
  if (!body.student_id || (body.session_type !== "chat" && body.session_type !== "video")) {
    return NextResponse.json({ error: "student_id and session_type required" }, { status: 400 });
  }
  if (body.session_type === "video" && !body.meet_url?.trim()) {
    return NextResponse.json({ error: "Attach a meeting link for video sessions" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data: sub } = await admin
      .from("subscriptions")
      .select("id, professional_id")
      .eq("student_id", body.student_id)
      .eq("professional_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    if (!sub) return NextResponse.json({ error: "No active match with this student" }, { status: 404 });

    const { error } = await admin
      .from("subscriptions")
      .update({
        session_type: body.session_type,
        meet_url: body.session_type === "video" ? body.meet_url?.trim() : null,
      })
      .eq("id", sub.id);
    if (error) throw error;

    // Upcoming scheduled sessions follow the new type (editable after matching).
    const { data: upcoming } = await admin
      .from("sessions")
      .select("id")
      .eq("subscription_id", sub.id)
      .eq("status", "scheduled")
      .gte("scheduled_at", new Date().toISOString());

    for (const session of upcoming ?? []) {
      await admin.from("sessions").update({ modality: body.session_type }).eq("id", session.id);
      if (body.session_type === "video" && body.meet_url?.trim()) {
        await admin.from("session_meet_links").upsert(
          { session_id: session.id, meet_url: body.meet_url.trim() },
          { onConflict: "session_id" },
        );
      }
    }

    return NextResponse.json({ ok: true, session_type: body.session_type });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not update session type" },
      { status: 500 },
    );
  }
}
