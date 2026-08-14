import { NextResponse } from "next/server";
import { assistOnExercise } from "@/lib/care-loop";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { question?: string };

  try {
    const admin = createAdminClient();
    const { data: exercise } = await admin
      .from("loop_exercises")
      .select("id, plan_id, title, instructions")
      .eq("id", id)
      .maybeSingle();
    if (!exercise) return NextResponse.json({ error: "Exercise not found" }, { status: 404 });

    const { data: plan } = await admin
      .from("loop_plans")
      .select("student_id, status")
      .eq("id", exercise.plan_id)
      .maybeSingle();
    if (!plan || plan.student_id !== user.id || plan.status !== "published") {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const suggestion = assistOnExercise(
      { title: exercise.title as string, instructions: exercise.instructions as string },
      body.question,
    );

    const { data: row, error } = await admin
      .from("loop_assists")
      .insert({
        exercise_id: id,
        student_id: user.id,
        question: body.question?.trim() || null,
        suggestion,
      })
      .select("id, suggestion, created_at")
      .single();
    if (error) throw error;

    return NextResponse.json({ assist: row });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not get assist" },
      { status: 500 },
    );
  }
}
