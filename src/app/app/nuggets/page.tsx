"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/Ui";
import { createClient } from "@/lib/supabase/client";
import type { Nugget } from "@/lib/types";

export default function StudentNuggets() {
  const [nuggets, setNuggets] = useState<(Nugget & { author?: string })[]>([]);

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const { data } = await supabase
        .from("nuggets")
        .select("*, profiles:professional_id(full_name)")
        .order("created_at", { ascending: false });
      setNuggets(
        ((data ?? []) as (Nugget & { profiles?: { full_name: string } })[]).map((n) => ({
          ...n,
          author: n.profiles?.full_name,
        })),
      );
    })();
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl">Nuggets</h1>
      <p className="mt-2 text-sm text-muted">
        Short posts from professionals you subscribe to — encouragement, skills, and resources.
      </p>
      <div className="mt-6 space-y-3">
        {nuggets.length === 0 ? <p className="text-muted">Nothing yet. Subscribe, then wait for a first nugget.</p> : null}
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
