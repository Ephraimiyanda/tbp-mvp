import { NextResponse } from "next/server";
import { loadDirectoryProfessionals } from "@/lib/directory";
import { rankProfessionals } from "@/lib/matching";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Intake } from "@/lib/types";

/**
 * Ends the active subscription and returns the next professional to try.
 * Marks the previous professional as declined so rematch doesn't loop.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Rematch is not configured" }, { status: 503 });
  }

  try {
    const admin = createAdminClient();

    const { data: activeSub } = await admin
      .from("subscriptions")
      .select("id, professional_id")
      .eq("student_id", user.id)
      .eq("status", "active")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const previousProId = (activeSub?.professional_id as string | undefined) ?? null;

    if (activeSub) {
      const { error: cancelError } = await admin
        .from("subscriptions")
        .update({ status: "cancelled" })
        .eq("id", activeSub.id);
      if (cancelError) throw cancelError;
    }

    if (previousProId) {
      await admin.from("matches").upsert(
        {
          student_id: user.id,
          professional_id: previousProId,
          status: "declined",
          reasons: ["Rematched"],
        },
        { onConflict: "student_id,professional_id" },
      );
    }

    // Clear other proposed matches so index picks a fresh candidate.
    await admin
      .from("matches")
      .update({ status: "declined" })
      .eq("student_id", user.id)
      .eq("status", "proposed");

    const { data: intakeRow } = await admin
      .from("intakes")
      .select("*")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!intakeRow) {
      return NextResponse.json({ error: "Complete signup before rematching" }, { status: 400 });
    }

    const { data: priorMatches } = await admin
      .from("matches")
      .select("professional_id, status")
      .eq("student_id", user.id);
    const declined = new Set(
      (priorMatches ?? [])
        .filter((m) => m.status === "declined")
        .map((m) => m.professional_id as string),
    );
    if (previousProId) declined.add(previousProId);

    const professionals = await loadDirectoryProfessionals();
    const list = professionals.filter((p) => p.credentials && !declined.has(p.profile_id));
    const ranked = rankProfessionals(intakeRow as Intake, list);
    const next = ranked[0]?.professional;

    if (!next) {
      return NextResponse.json(
        {
          ok: true,
          previous_professional_id: previousProId,
          next_professional_id: null,
          error: "No other professionals available right now",
        },
        { status: 200 },
      );
    }

    return NextResponse.json({
      ok: true,
      previous_professional_id: previousProId,
      next_professional_id: next.profile_id,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not rematch" },
      { status: 500 },
    );
  }
}
