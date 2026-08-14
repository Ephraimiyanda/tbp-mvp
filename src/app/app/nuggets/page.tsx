"use client";

import { useEffect, useState } from "react";
import { BackButton } from "@/components/NavControls";
import { Card } from "@/components/Ui";
import { createClient } from "@/lib/supabase/client";
import type { Nugget } from "@/lib/types";

export default function StudentNuggets() {
  const [nuggets, setNuggets] = useState<(Nugget & { author?: string })[]>([]);

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("professional_id")
        .eq("student_id", auth.user.id)
        .eq("status", "active");
      const proIds = (subs ?? []).map((s) => s.professional_id as string);
      if (!proIds.length) {
        setNuggets([]);
        return;
      }
      const { data } = await supabase
        .from("nuggets")
        .select("*")
        .in("professional_id", proIds)
        .order("created_at", { ascending: false });
      const dir = await fetch("/api/directory");
      const names = new Map<string, string>();
      if (dir.ok) {
        const json = (await dir.json()) as {
          professionals?: { profile_id: string; profiles?: { full_name: string } | null }[];
        };
        for (const p of json.professionals ?? []) {
          if (p.profiles?.full_name) names.set(p.profile_id, p.profiles.full_name);
        }
      }
      setNuggets(
        ((data ?? []) as Nugget[]).map((n) => ({
          ...n,
          author: names.get(n.professional_id) ?? "Professional",
        })),
      );
    })();
  }, []);

  return (
    <div>
      <BackButton href="/app" label="Home" />
      <h1 className="font-display mt-3 text-3xl">Nuggets</h1>
      <p className="mt-2 text-sm text-muted">
        Short posts from professionals you subscribe to — encouragement, skills, and resources.
      </p>
      <div className="mt-6 space-y-3">
        {nuggets.length === 0 ? (
          <p className="text-muted">Nothing yet. Subscribe, then wait for a first nugget.</p>
        ) : null}
        {nuggets.map((n) => (
          <Card key={n.id}>
            <p className="text-xs text-muted">
              {n.author} · {new Date(n.created_at).toLocaleDateString()}
            </p>
            <h2 className="mt-1 font-semibold">{n.title}</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{n.body}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
