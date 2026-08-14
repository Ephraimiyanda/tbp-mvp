import { NextResponse } from "next/server";
import { createGoogleMeetLink } from "@/lib/google-meet";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = (await request.json()) as {
    student_id?: string;
    subscription_id?: string;
    scheduled_at?: string;
    duration_min?: number;
    meet_url?: string;
    notes_professional?: string;
    modality?: "video" | "chat";
  };

  if (!body.student_id || !body.subscription_id || !body.scheduled_at) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("id, student_id, professional_id, status, session_type, meet_url")
    .eq("id", body.subscription_id)
    .single();

  if (!sub || sub.professional_id !== user.id || sub.status !== "active") {
    return NextResponse.json({ error: "No active subscription" }, { status: 403 });
  }

  const { data: intake } = await supabase
    .from("intakes")
    .select("communication")
    .eq("student_id", sub.student_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const modality: "video" | "chat" =
    body.modality === "chat" || body.modality === "video"
      ? body.modality
      : sub.session_type === "chat" || sub.session_type === "video"
        ? sub.session_type
        : intake?.communication === "message"
          ? "chat"
          : "video";

  const start = new Date(body.scheduled_at);
  const duration = body.duration_min ?? (modality === "chat" ? 40 : 50);
  const end = new Date(start.getTime() + duration * 60_000);

  const { data: session, error } = await supabase
    .from("sessions")
    .insert({
      subscription_id: sub.id,
      student_id: sub.student_id,
      professional_id: user.id,
      scheduled_at: start.toISOString(),
      duration_min: duration,
      modality,
      notes_professional: body.notes_professional ?? null,
    })
    .select("id")
    .single();

  if (error || !session) {
    return NextResponse.json({ error: error?.message ?? "Could not schedule" }, { status: 400 });
  }

  if (modality === "chat") {
    return NextResponse.json({ id: session.id, modality });
  }

  const { data: pro } = await supabase
    .from("professionals")
    .select("default_meet_url")
    .eq("profile_id", user.id)
    .single();
  const { data: student } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", sub.student_id)
    .single();
  const { data: me } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", user.id)
    .single();

  const minted = await createGoogleMeetLink({
    summary: `Myalo session · ${me?.full_name ?? "Professional"} & ${student?.full_name ?? "Student"}`,
    start,
    end,
    attendeeEmails: [me?.email, student?.email].filter(Boolean) as string[],
    requestId: session.id,
  });

  const meetUrl = minted || body.meet_url?.trim() || sub.meet_url || pro?.default_meet_url || null;
  if (!meetUrl) {
    await supabase.from("sessions").delete().eq("id", session.id);
    return NextResponse.json(
      { error: "Add a Google Meet link (or connect Calendar) before scheduling a video session." },
      { status: 400 },
    );
  }

  const { error: linkError } = await supabase.from("session_meet_links").insert({
    session_id: session.id,
    meet_url: meetUrl,
  });
  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 400 });
  }

  return NextResponse.json({ id: session.id, modality });
}
