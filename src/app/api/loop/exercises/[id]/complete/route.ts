import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { id } = await context.params;
  try {
    const admin = createAdminClient();
    const { data: exercise } = await admin.from("loop_exercises").select("id, plan_id").eq("id", id).maybeSingle();
    if (!exercise) return NextResponse.json({ error: "Exercise not found" }, { status: 404 });

    const { data: plan } = await admin
      .from("loop_plans")
      .select("student_id, status")
      .eq("id", exercise.plan_id)
      .maybeSingle();
    if (!plan || plan.student_id !== user.id || plan.status !== "published") {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const { error } = await admin.from("loop_exercise_progress").upsert(
      {
        exercise_id: id,
        student_id: user.id,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "exercise_id,student_id" },
    );
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not save progress" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { id } = await context.params;
  try {
    const admin = createAdminClient();
    await admin.from("loop_exercise_progress").delete().eq("exercise_id", id).eq("student_id", user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not update progress" },
      { status: 500 },
    );
  }
}
