import { NextResponse } from "next/server";
import { suggestExercises } from "@/lib/care-loop";
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

    const { data: session } = await admin
      .from("sessions")
      .select("notes_professional")
      .eq("id", plan.session_id)
      .maybeSingle();
    const { data: intake } = await admin
      .from("intakes")
      .select("concerns")
      .eq("student_id", plan.student_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const suggestions = suggestExercises({
      concerns: (intake?.concerns as string[]) ?? [],
      notes: (session?.notes_professional as string | null) ?? null,
    });
    return NextResponse.json({ suggestions });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not suggest exercises" },
      { status: 500 },
    );
  }
}
