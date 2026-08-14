import { NextResponse } from "next/server";
import { loadLoopPlan } from "@/lib/loop-store";
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
    const { data: plan } = await admin.from("loop_plans").select("*").eq("id", id).maybeSingle();
    if (!plan || plan.professional_id !== user.id) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const { count } = await admin
      .from("loop_exercises")
      .select("id", { count: "exact", head: true })
      .eq("plan_id", id);
    if (!count) {
      return NextResponse.json({ error: "Add at least one exercise before publishing" }, { status: 400 });
    }

    // One published plan is the active checklist — archive older published ones for this pair.
    await admin
      .from("loop_plans")
      .update({ status: "archived" })
      .eq("student_id", plan.student_id)
      .eq("professional_id", plan.professional_id)
      .eq("status", "published")
      .neq("id", id);

    const { error } = await admin
      .from("loop_plans")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;

    const next = await loadLoopPlan(id, plan.student_id as string);
    return NextResponse.json({ plan: next });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not publish plan" },
      { status: 500 },
    );
  }
}
