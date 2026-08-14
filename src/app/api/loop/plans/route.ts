import { NextResponse } from "next/server";
import { loadPublishedPlanForStudent, loadLoopPlan } from "@/lib/loop-store";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Care Loop is not configured" }, { status: 503 });
  }

  const url = new URL(request.url);
  const studentId = url.searchParams.get("student_id") ?? user.id;
  const sessionId = url.searchParams.get("session_id");
  const history = url.searchParams.get("history") === "1";

  try {
    const admin = createAdminClient();
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
    const isPro = profile?.role === "professional";
    if (!isPro && studentId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (isPro && studentId !== user.id) {
      const { data: sub } = await admin
        .from("subscriptions")
        .select("id")
        .eq("professional_id", user.id)
        .eq("student_id", studentId)
        .eq("status", "active")
        .maybeSingle();
      if (!sub) return NextResponse.json({ error: "No active care pair" }, { status: 403 });
    }

    if (sessionId) {
      const { data: existing } = await admin
        .from("loop_plans")
        .select("id")
        .eq("session_id", sessionId)
        .maybeSingle();
      if (!existing) return NextResponse.json({ plan: null });
      const plan = await loadLoopPlan(existing.id as string, studentId);
      return NextResponse.json({ plan });
    }

    if (history && isPro) {
      const { data: rows } = await admin
        .from("loop_plans")
        .select("id")
        .eq("professional_id", user.id)
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });
      const plans = [];
      for (const row of rows ?? []) {
        const plan = await loadLoopPlan(row.id as string, studentId);
        if (plan) plans.push(plan);
      }
      return NextResponse.json({ plans });
    }

    const plan = await loadPublishedPlanForStudent(studentId);
    return NextResponse.json({ plan });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load plan" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Care Loop is not configured" }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    session_id?: string;
    title?: string;
  };
  if (!body.session_id) return NextResponse.json({ error: "session_id required" }, { status: 400 });

  try {
    const admin = createAdminClient();
    const { data: session } = await admin
      .from("sessions")
      .select("id, student_id, professional_id, subscription_id")
      .eq("id", body.session_id)
      .maybeSingle();
    if (!session || session.professional_id !== user.id) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const { data: existing } = await admin
      .from("loop_plans")
      .select("id")
      .eq("session_id", session.id)
      .maybeSingle();
    if (existing) {
      const plan = await loadLoopPlan(existing.id as string, session.student_id as string);
      return NextResponse.json({ plan });
    }

    const { data: created, error } = await admin
      .from("loop_plans")
      .insert({
        session_id: session.id,
        subscription_id: session.subscription_id,
        student_id: session.student_id,
        professional_id: user.id,
        title: body.title?.trim() || "Between-session plan",
        status: "draft",
      })
      .select("id")
      .single();
    if (error || !created) throw error ?? new Error("Could not create plan");
    const plan = await loadLoopPlan(created.id as string, session.student_id as string);
    return NextResponse.json({ plan });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not create plan" },
      { status: 500 },
    );
  }
}
