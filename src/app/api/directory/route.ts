import { NextResponse } from "next/server";
import { loadDirectoryGroups, loadDirectoryProfessionals } from "@/lib/directory";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Directory is not configured" }, { status: 503 });
  }

  try {
    const [professionals, groupPayload] = await Promise.all([
      loadDirectoryProfessionals(),
      loadDirectoryGroups(user.id),
    ]);
    return NextResponse.json({
      professionals,
      groups: groupPayload.groups,
      my_group_ids: groupPayload.my_group_ids,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load directory" },
      { status: 500 },
    );
  }
}
