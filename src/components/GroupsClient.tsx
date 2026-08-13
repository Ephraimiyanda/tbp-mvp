"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, Field, OptionButton, PrimaryButton, TextArea, TextInput } from "@/components/Ui";
import { createClient } from "@/lib/supabase/client";
import { CONCERNS, type Checkin, type GroupMember, type GroupRow } from "@/lib/types";

export function GroupsIndex({ basePath }: { basePath: "/app" | "/pro" }) {
  const [groups, setGroups] = useState<(GroupRow & { count: number })[]>([]);
  const [mine, setMine] = useState<string[]>([]);

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const { data } = await supabase.from("groups").select("*").order("created_at", { ascending: false });
      const { data: members } = await supabase.from("group_members").select("group_id, profile_id");
      const counts = new Map<string, number>();
      const my = new Set<string>();
      for (const m of members ?? []) {
        counts.set(m.group_id, (counts.get(m.group_id) ?? 0) + 1);
        if (m.profile_id === auth.user?.id) my.add(m.group_id);
      }
      setMine([...my]);
      setGroups(((data ?? []) as GroupRow[]).map((g) => ({ ...g, count: counts.get(g.id) ?? 0 })));
    })();
  }, []);

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Peer groups</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Students or professionals can create a group and remain its admin. Rooms stay small so
            check-ins stay personal.
          </p>
        </div>
        <Link href={`${basePath}/groups/new`} className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-paper">
          Create a group
        </Link>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {groups.map((g) => (
          <Card key={g.id}>
            <p className="text-xs uppercase text-muted">{g.tags.join(" · ") || "open"}</p>
            <h2 className="mt-1 font-display text-xl">{g.name}</h2>
            <p className="mt-2 text-sm text-muted">{g.description}</p>
            <p className="mt-3 text-sm">
              {g.count}/{g.member_cap} members
              {mine.includes(g.id) ? " · you’re in" : ""}
            </p>
            <Link href={`${basePath}/groups/${g.id}`} className="mt-3 inline-block text-sm font-semibold text-navy">
              Open
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function GroupCreate({ basePath }: { basePath: "/app" | "/pro" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sign in");
      const { data, error: insertError } = await supabase
        .from("groups")
        .insert({ name, description, tags, created_by: auth.user.id })
        .select("id")
        .single();
      if (insertError || !data) throw insertError ?? new Error("Could not create");
      router.push(`${basePath}/groups/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create group");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl">New group</h1>
      <p className="mt-2 text-sm text-muted">You become the admin. Members can join until the cap is reached.</p>
      <div className="mt-6 space-y-4">
        <Field label="Name">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Description">
          <TextArea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <p className="text-sm font-medium">Tags</p>
        <div className="grid gap-2">
          {CONCERNS.map((c) => (
            <OptionButton
              key={c.id}
              selected={tags.includes(c.id)}
              onClick={() =>
                setTags((list) => (list.includes(c.id) ? list.filter((x) => x !== c.id) : [...list, c.id]))
              }
            >
              {c.label}
            </OptionButton>
          ))}
        </div>
      </div>
      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
      <div className="mt-6">
        <PrimaryButton onClick={create} disabled={busy || !name}>
          {busy ? "Creating…" : "Create group"}
        </PrimaryButton>
      </div>
    </div>
  );
}

export function GroupDetail({
  groupId,
  basePath,
}: {
  groupId: string;
  basePath: "/app" | "/pro";
}) {
  const [group, setGroup] = useState<GroupRow | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [mine, setMine] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [mood, setMood] = useState(3);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    const { data: g } = await supabase.from("groups").select("*").eq("id", groupId).single();
    setGroup(g as GroupRow);
    const { data: m } = await supabase.from("group_members").select("*").eq("group_id", groupId);
    const list = (m ?? []) as GroupMember[];
    setMembers(list);
    const me = list.find((row) => row.profile_id === auth.user?.id);
    setMine(Boolean(me));
    setAdmin(me?.role === "admin");
    if (me) {
      const { data: c } = await supabase
        .from("group_checkins")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true });
      setCheckins((c as Checkin[]) ?? []);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  async function join() {
    setError(null);
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { error: joinError } = await supabase.from("group_members").insert({
      group_id: groupId,
      profile_id: auth.user.id,
      role: "member",
    });
    if (joinError) setError(joinError.message);
    else await reload();
  }

  async function checkin() {
    setError(null);
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { error: cError } = await supabase.from("group_checkins").insert({
      group_id: groupId,
      profile_id: auth.user.id,
      mood,
      note: note || null,
    });
    if (cError) setError(cError.message);
    else {
      setNote("");
      await reload();
    }
  }

  if (!group) return <p className="text-muted">Loading…</p>;

  const growth = checkins.slice(-8);

  return (
    <div className="max-w-2xl">
      <Link href={`${basePath}/groups`} className="text-sm text-muted">
        ← Groups
      </Link>
      <h1 className="font-display mt-3 text-3xl">{group.name}</h1>
      <p className="mt-2 text-sm text-muted">{group.description}</p>
      <p className="mt-2 text-sm">
        {members.length}/{group.member_cap} members{admin ? " · you admin this group" : ""}
      </p>
      {!mine ? (
        <div className="mt-6">
          <PrimaryButton onClick={join} disabled={members.length >= group.member_cap}>
            Join group
          </PrimaryButton>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <Card>
            <h2 className="font-display text-xl">Check in</h2>
            <p className="mt-1 text-sm text-muted">Mood 1–5. This trail is how the group tracks growth.</p>
            <div className="mt-4 flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setMood(n)}
                  className={`h-10 w-10 rounded-full text-sm ${mood === n ? "bg-navy text-paper" : "bg-line"}`}
                >
                  {n}
                </button>
              ))}
            </div>
            <TextArea className="mt-3" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note" />
            <div className="mt-3">
              <PrimaryButton onClick={checkin}>Save check-in</PrimaryButton>
            </div>
          </Card>
          <Card>
            <h2 className="font-display text-xl">Growth</h2>
            <div className="mt-4 flex h-24 items-end gap-2">
              {growth.length === 0 ? <p className="text-sm text-muted">No check-ins yet.</p> : null}
              {growth.map((c) => (
                <div key={c.id} className="flex-1 rounded-t bg-clay" style={{ height: `${(c.mood / 5) * 100}%` }} title={`${c.mood} · ${new Date(c.created_at).toLocaleDateString()}`} />
              ))}
            </div>
          </Card>
        </div>
      )}
      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
