import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const isCron =
    (secret && request.headers.get("authorization") === `Bearer ${secret}`) ||
    request.headers.get("x-vercel-cron") === "1";
  if (!isCron) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data: due, error } = await admin
    .from("sessions")
    .select("id, student_id, professional_id, scheduled_at")
    .is("meet_released_at", null)
    .lte("scheduled_at", now)
    .eq("status", "scheduled");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ids = (due ?? []).map((s) => s.id);
  if (ids.length) {
    await admin
      .from("sessions")
      .update({ meet_released_at: now, status: "released" })
      .in("id", ids);
  }

  return NextResponse.json({ released: ids.length });
}
