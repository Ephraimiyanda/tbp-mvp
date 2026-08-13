import { NextResponse } from "next/server";
import { loadDirectoryProfessional } from "@/lib/directory";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Directory is not configured" }, { status: 503 });
  }

  const { id } = await context.params;
  try {
    const professional = await loadDirectoryProfessional(id);
    if (!professional?.credentials) {
      return NextResponse.json({ error: "Professional not found" }, { status: 404 });
    }
    return NextResponse.json({ professional });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load professional" },
      { status: 500 },
    );
  }
}
