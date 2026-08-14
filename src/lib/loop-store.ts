import { createAdminClient } from "@/lib/supabase/admin";
import type { LoopExercise, LoopPlan } from "@/lib/care-loop";

export async function loadLoopPlan(planId: string, studentId?: string): Promise<LoopPlan | null> {
  const admin = createAdminClient();
  const { data: plan, error } = await admin.from("loop_plans").select("*").eq("id", planId).maybeSingle();
  if (error) throw error;
  if (!plan) return null;

  const { data: exercises, error: exError } = await admin
    .from("loop_exercises")
    .select("*")
    .eq("plan_id", planId)
    .order("sort_order", { ascending: true });
  if (exError) throw exError;

  const ids = (exercises ?? []).map((e) => e.id as string);
  const completed = new Map<string, string>();
  const stuck = new Set<string>();
  if (ids.length) {
    const sid = studentId ?? (plan.student_id as string);
    const { data: progress } = await admin
      .from("loop_exercise_progress")
      .select("exercise_id, completed_at")
      .eq("student_id", sid)
      .in("exercise_id", ids);
    for (const row of progress ?? []) {
      completed.set(row.exercise_id as string, row.completed_at as string);
    }
    const { data: assists } = await admin
      .from("loop_assists")
      .select("exercise_id")
      .eq("student_id", sid)
      .in("exercise_id", ids);
    for (const row of assists ?? []) stuck.add(row.exercise_id as string);
  }

  const { data: session } = await admin
    .from("sessions")
    .select("scheduled_at")
    .eq("id", plan.session_id)
    .maybeSingle();

  return {
    ...(plan as Omit<LoopPlan, "exercises">),
    session_at: (session?.scheduled_at as string | undefined) ?? null,
    exercises: ((exercises ?? []) as LoopExercise[]).map((e) => ({
      ...e,
      completed_at: completed.get(e.id) ?? null,
      stuck: stuck.has(e.id),
    })),
  };
}

export async function loadPublishedPlanForStudent(studentId: string): Promise<LoopPlan | null> {
  const admin = createAdminClient();
  const { data: plan, error } = await admin
    .from("loop_plans")
    .select("id")
    .eq("student_id", studentId)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!plan) return null;
  return loadLoopPlan(plan.id as string, studentId);
}
