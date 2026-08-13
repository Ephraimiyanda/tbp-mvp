import { NextResponse } from "next/server";
import { originFromRequest, safeNextPath } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const origin = originFromRequest(request);

  const supabase = await createClient();
  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  const fromQuery = searchParams.get("next");
  if (fromQuery) {
    return NextResponse.redirect(`${origin}${safeNextPath(fromQuery, "/app")}`);
  }

  const { data } = await supabase.auth.getUser();
  const role = data.user?.user_metadata?.role;
  const next =
    role === "professional" ? "/onboarding" : data.user ? "/matching" : "/login";

  return NextResponse.redirect(`${origin}${next}`);
}
