import { NextResponse } from "next/server";
import { PRODUCTION_ORIGIN, originFromRequest, safeNextPath } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

/** Kept for older confirmation links; new signups skip email verification. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const origin = originFromRequest(request);

  const supabase = await createClient();
  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
    await supabase.auth.signOut();
  }

  const fromQuery = searchParams.get("next");
  if (fromQuery) {
    return NextResponse.redirect(`${origin}${safeNextPath(fromQuery, "/login")}`);
  }

  return NextResponse.redirect(`${PRODUCTION_ORIGIN}/login`);
}
