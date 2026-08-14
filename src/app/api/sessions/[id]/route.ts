import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { id } = await context.params;
  try {
    const admin = createAdminClient();
    const { data: session } = await admin.from("sessions").select("*").eq("id", id).maybeSingle();
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    if (session.student_id !== user.id && session.professional_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: link } = await admin
      .from("session_meet_links")
      .select("meet_url")
      .eq("session_id", id)
      .maybeSingle();

    const isPro = session.professional_id === user.id;
    const released = Boolean(session.meet_released_at);
    const meetUrl =
      session.modality === "video" && (isPro || released) ? (link?.meet_url as string | undefined) ?? null : null;

    const { data: plan } = await admin.from("loop_plans").select("id, status").eq("session_id", id).maybeSingle();

    return NextResponse.json({
      session,
      meet_url: meetUrl,
      loop_plan: plan,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load session" },
      { status: 500 },
    );
  }
}
