import { NextResponse } from "next/server";
import { DEMO_PLAN_AMOUNT_KOBO } from "@/lib/demo-data";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { planForConcerns } from "@/lib/types";

type Body = {
  professional_id?: string;
  reference?: string;
  amount_kobo?: number;
};

function modalityFromCommunication(value: string | null | undefined): "video" | "chat" {
  if (value === "message") return "chat";
  return "video";
}

/**
 * Completes mock Paystack payment: activates subscription, care plan,
 * records payment, and schedules the first session (chat or video).
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const professionalId = body.professional_id?.trim();
  const reference = body.reference?.trim();
  const amount = body.amount_kobo ?? DEMO_PLAN_AMOUNT_KOBO;
  if (!professionalId || !reference) {
    return NextResponse.json({ error: "Missing professional or payment reference" }, { status: 400 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Server payment complete is not configured" }, { status: 503 });
  }

  try {
    const admin = createAdminClient();

    const { data: intake } = await admin
      .from("intakes")
      .select("*")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!intake) {
      return NextResponse.json({ error: "Complete the questionnaire first" }, { status: 400 });
    }

    const plan = planForConcerns((intake.concerns as string[]) ?? []);
    const modality = modalityFromCommunication(intake.communication as string | null);

    const { data: match } = await admin
      .from("matches")
      .select("id")
      .eq("student_id", user.id)
      .eq("professional_id", professionalId)
      .maybeSingle();

    const { data: sub, error: subError } = await admin
      .from("subscriptions")
      .upsert(
        {
          student_id: user.id,
          professional_id: professionalId,
          match_id: match?.id ?? null,
          status: "active",
          plan: "student",
        },
        { onConflict: "student_id,professional_id" },
      )
      .select("id")
      .single();
    if (subError || !sub) {
      return NextResponse.json({ error: subError?.message ?? "Could not subscribe" }, { status: 400 });
    }

    if (match?.id) {
      await admin.from("matches").update({ status: "subscribed" }).eq("id", match.id);
    }

    await admin.from("care_plans").upsert(
      {
        subscription_id: sub.id,
        primary_issue: plan.issue,
        duration_weeks: plan.weeks,
        session_target: plan.sessions,
      },
      { onConflict: "subscription_id" },
    );

    await admin.from("payments").upsert(
      {
        subscription_id: sub.id,
        student_id: user.id,
        amount_kobo: amount,
        currency: "NGN",
        provider: "paystack_mock",
        reference,
        status: "success",
      },
      { onConflict: "reference" },
    );

    const { data: existingSession } = await admin
      .from("sessions")
      .select("id")
      .eq("subscription_id", sub.id)
      .order("scheduled_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    let sessionId = existingSession?.id as string | undefined;
    if (!sessionId) {
      const scheduledAt = new Date(Date.now() + 2 * 60_000).toISOString();
      const { data: session, error: sessionError } = await admin
        .from("sessions")
        .insert({
          subscription_id: sub.id,
          student_id: user.id,
          professional_id: professionalId,
          scheduled_at: scheduledAt,
          duration_min: modality === "chat" ? 40 : 50,
          modality,
          notes_professional:
            modality === "chat"
              ? "First check-in over secure chat (demo)."
              : "First Google Meet session (demo).",
        })
        .select("id")
        .single();
      if (sessionError || !session) {
        return NextResponse.json(
          { error: sessionError?.message ?? "Could not schedule first session" },
          { status: 400 },
        );
      }
      sessionId = session.id;

      if (modality === "video") {
        const { data: pro } = await admin
          .from("professionals")
          .select("default_meet_url")
          .eq("profile_id", professionalId)
          .maybeSingle();
        const meetUrl =
          pro?.default_meet_url || `https://meet.google.com/lookup/myalo-${String(sessionId).slice(0, 8)}`;
        await admin.from("session_meet_links").insert({
          session_id: sessionId,
          meet_url: meetUrl,
        });
      }
    }

    return NextResponse.json({
      subscription_id: sub.id,
      session_id: sessionId ?? null,
      modality,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Payment complete failed" },
      { status: 500 },
    );
  }
}
