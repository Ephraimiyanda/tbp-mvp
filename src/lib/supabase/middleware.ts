import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isApp = path.startsWith("/app") || path.startsWith("/pro") || path.startsWith("/onboarding");

  if (!user && isApp) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/login";
    redirect.searchParams.set("next", path);
    return NextResponse.redirect(redirect);
  }

  if (user && (path === "/login" || path === "/get-started")) {
    return redirectAuthedAway(request, supabase, user.id);
  }

  if (user && path === "/signup") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, consented_at")
      .eq("id", user.id)
      .maybeSingle();
    // Incomplete signup may still need the questionnaire.
    if (profile?.consented_at) {
      return redirectAuthedAway(request, supabase, user.id, profile.role);
    }
  }

  return response;
}

async function redirectAuthedAway(
  request: NextRequest,
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  knownRole?: string | null,
) {
  let role = knownRole;
  if (role === undefined) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, consented_at")
      .eq("id", userId)
      .maybeSingle();
    role = profile?.role;
    if (role === "professional" && !profile?.consented_at) {
      const redirect = request.nextUrl.clone();
      redirect.pathname = "/onboarding";
      redirect.search = "";
      return NextResponse.redirect(redirect);
    }
  }

  const redirect = request.nextUrl.clone();
  redirect.pathname = role === "professional" ? "/pro" : "/app";
  redirect.search = "";
  return NextResponse.redirect(redirect);
}
