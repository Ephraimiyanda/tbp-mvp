import { createAdminClient } from "@/lib/supabase/admin";
import { DEMO_COMMUNITIES, DEMO_PASSWORD, DEMO_PROFESSIONALS } from "@/lib/demo-data";

type Admin = ReturnType<typeof createAdminClient>;

async function findUserIdByEmail(admin: Admin, email: string) {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw error;
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id ?? null;
}

async function ensureDemoUser(
  admin: Admin,
  input: { email: string; full_name: string; role: "professional" | "student" },
) {
  let userId = await findUserIdByEmail(admin, input.email);
  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email: input.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: input.full_name, role: input.role },
    });
    if (error) throw error;
    userId = data.user?.id ?? null;
  }
  if (!userId) throw new Error(`Could not create ${input.email}`);

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      email: input.email,
      full_name: input.full_name,
      role: input.role,
      consented_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (profileError) throw profileError;
  return userId;
}

export async function seedDemoContent() {
  const admin = createAdminClient();
  const proIds: Record<string, string> = {};

  for (const pro of DEMO_PROFESSIONALS) {
    const id = await ensureDemoUser(admin, {
      email: pro.email,
      full_name: pro.full_name,
      role: "professional",
    });
    proIds[pro.email] = id;

    const { error: proError } = await admin.from("professionals").upsert(
      {
        profile_id: id,
        credentials: pro.credentials,
        specialties: [...pro.specialties],
        bio: pro.bio,
        approach: pro.approach,
        gender: pro.gender,
        tone: pro.tone,
        lgbtq_affirming: pro.lgbtq_affirming,
        faith_sensitive: pro.faith_sensitive,
        default_meet_url: pro.default_meet_url,
        verified: true,
      },
      { onConflict: "profile_id" },
    );
    if (proError) throw proError;

    const { data: existingNuggets } = await admin
      .from("nuggets")
      .select("title")
      .eq("professional_id", id);
    const titles = new Set((existingNuggets ?? []).map((n) => n.title as string));
    for (const nugget of pro.nuggets) {
      if (titles.has(nugget.title)) continue;
      const { error } = await admin.from("nuggets").insert({
        professional_id: id,
        title: nugget.title,
        body: nugget.body,
      });
      if (error) throw error;
    }
  }

  const groupsCreated: { name: string; id: string }[] = [];
  for (const community of DEMO_COMMUNITIES) {
    const adminId = proIds[community.admin_email];
    if (!adminId) continue;

    const { data: existing } = await admin
      .from("groups")
      .select("id, name")
      .eq("name", community.name)
      .eq("created_by", adminId)
      .maybeSingle();

    let groupId = existing?.id as string | undefined;
    if (!groupId) {
      const { data: group, error } = await admin
        .from("groups")
        .insert({
          name: community.name,
          description: community.description,
          tags: [...community.tags],
          created_by: adminId,
          member_cap: 40,
        })
        .select("id")
        .single();
      if (error) throw error;
      groupId = group.id;
    }

    groupsCreated.push({ name: community.name, id: groupId! });
  }

  return {
    professionals: DEMO_PROFESSIONALS.map((p) => ({
      email: p.email,
      name: p.full_name,
      id: proIds[p.email],
    })),
    communities: groupsCreated,
    password: DEMO_PASSWORD,
  };
}
