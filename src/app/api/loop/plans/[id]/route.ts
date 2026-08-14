import { NextResponse } from "next/server";
import type { ExerciseDraft } from "@/lib/care-loop";
import { loadLoopPlan } from "@/lib/loop-store";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    title?: string;
    exercises?: ExerciseDraft[];
  };

  try {
    const admin = createAdminClient();
    const { data: plan } = await admin.from("loop_plans").select("*").eq("id", id).maybeSingle();
    if (!plan || plan.professional_id !== user.id) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    if (body.title?.trim()) {
      await admin.from("loop_plans").update({ title: body.title.trim() }).eq("id", id);
    }

    if (Array.isArray(body.exercises)) {
      await admin.from("loop_exercises").delete().eq("plan_id", id);
      if (body.exercises.length) {
        const rows = body.exercises
          .filter((e) => e.title.trim())
          .map((e, i) => ({
            plan_id: id,
            sort_order: i,
            title: e.title.trim(),
            instructions: e.instructions?.trim() || "",
            resource_url: e.resource_url?.trim() || null,
          }));
        if (rows.length) {
          const { error } = await admin.from("loop_exercises").insert(rows);
          if (error) throw error;
        }
      }
    }

    const next = await loadLoopPlan(id, plan.student_id as string);
    return NextResponse.json({ plan: next });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not save plan" },
      { status: 500 },
    );
  }
}
