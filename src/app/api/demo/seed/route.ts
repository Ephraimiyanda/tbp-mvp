import { NextResponse } from "next/server";
import { seedDemoContent } from "@/lib/seed-demo";

/**
 * Seeds live mock professionals, matched students, Care Loop plans, nuggets, and communities.
 * Requires SUPABASE_SERVICE_ROLE_KEY. Idempotent.
 */
export async function POST() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is required to seed demo data." },
      { status: 503 },
    );
  }

  try {
    const result = await seedDemoContent();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Seed failed" },
      { status: 500 },
    );
  }
}
