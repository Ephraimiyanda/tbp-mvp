import type { SupabaseClient } from "@supabase/supabase-js";
import type { IntakeDraft } from "./intake-draft";

async function ensureStudentProfile(
  supabase: SupabaseClient,
  userId: string,
  draft: IntakeDraft,
) {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (!existing) {
    const res = await fetch("/api/auth/ensure-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: draft.fullName,
        role: "student",
      }),
    });
    const payload = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      throw new Error(payload.error || "Could not create your profile. Try again.");
    }
  }

  const profileUpdate: Record<string, unknown> = {
    gender: draft.gender ?? null,
    university: draft.university ?? null,
    year_of_study: draft.year ?? null,
    consented_at: new Date().toISOString(),
  };
  const name = draft.fullName?.trim();
  if (name) {
    profileUpdate.full_name = name;
    profileUpdate.chosen_name = name;
  }

  const { data: updated, error: profileError } = await supabase
    .from("profiles")
    .update(profileUpdate)
    .eq("id", userId)
    .select("id")
    .maybeSingle();
  if (profileError) throw profileError;
  if (!updated) {
    throw new Error("Profile was not found after signup. Try logging in again.");
  }
}

export async function persistIntake(
  supabase: SupabaseClient,
  userId: string,
  draft: IntakeDraft,
) {
  await ensureStudentProfile(supabase, userId, draft);

  const payload = {
    student_id: userId,
    concerns: draft.concerns,
    prior_counseling: draft.prior ?? null,
    counselor_style: draft.style ?? null,
    tone: draft.tone ?? null,
    communication: draft.communication ?? null,
    pref_gender: draft.prefGender ?? "any",
    lgbtq_affirming: Boolean(draft.lgbtq),
    faith_sensitive: Boolean(draft.faith),
    answers: draft,
  };

  const { data: existing } = await supabase
    .from("intakes")
    .select("id")
    .eq("student_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("intakes").update(payload).eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("intakes").insert(payload);
    if (error) throw error;
  }
}
