import { createAdminClient } from "@/lib/supabase/admin";
import type { Professional } from "@/lib/types";

export type DirectoryProfessional = Professional & {
  profiles: { full_name: string; email: string | null } | null;
};

export type DirectoryGroup = {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  member_cap: number;
  created_by: string;
  created_at: string;
  member_count: number;
};

/** Service-role directory reads — avoids client RLS recursion on profile embeds. */
export async function loadDirectoryProfessionals(): Promise<DirectoryProfessional[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("professionals")
    .select("*, profiles:profile_id(full_name, email)")
    .not("credentials", "is", null)
    .order("verified", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as DirectoryProfessional[]).filter((p) => Boolean(p.credentials?.trim()));
}

export async function loadDirectoryProfessional(profileId: string): Promise<DirectoryProfessional | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("professionals")
    .select("*, profiles:profile_id(full_name, email)")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error) throw error;
  return (data as DirectoryProfessional | null) ?? null;
}

export async function loadDirectoryGroups(userId?: string): Promise<{
  groups: DirectoryGroup[];
  my_group_ids: string[];
}> {
  const admin = createAdminClient();
  const { data: groups, error } = await admin
    .from("groups")
    .select("id, name, description, tags, member_cap, created_by, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const { data: members, error: memberError } = await admin
    .from("group_members")
    .select("group_id, profile_id");
  if (memberError) throw memberError;

  const counts = new Map<string, number>();
  const mine = new Set<string>();
  for (const m of members ?? []) {
    const gid = m.group_id as string;
    counts.set(gid, (counts.get(gid) ?? 0) + 1);
    if (userId && m.profile_id === userId) mine.add(gid);
  }

  return {
    groups: ((groups ?? []) as Omit<DirectoryGroup, "member_count">[]).map((g) => ({
      ...g,
      tags: g.tags ?? [],
      member_count: counts.get(g.id) ?? 0,
    })),
    my_group_ids: [...mine],
  };
}
