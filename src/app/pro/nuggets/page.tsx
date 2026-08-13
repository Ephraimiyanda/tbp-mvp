"use client";

import { useEffect, useState } from "react";
import { Card, Field, PrimaryButton, TextArea, TextInput } from "@/components/Ui";
import { createClient } from "@/lib/supabase/client";
import type { Nugget } from "@/lib/types";

export default function ProNuggets() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [nuggets, setNuggets] = useState<Nugget[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { data } = await supabase
      .from("nuggets")
      .select("*")
      .eq("professional_id", auth.user.id)
      .order("created_at", { ascending: false });
    setNuggets((data as Nugget[]) ?? []);
  }

  useEffect(() => {
    void reload();
  }, []);

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { error: insertError } = await supabase.from("nuggets").insert({
      professional_id: auth.user.id,
      title,
      body,
    });
    if (insertError) setError(insertError.message);
    else {
      setTitle("");
      setBody("");
      await reload();
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_1fr]">
      <div>
        <h1 className="font-display text-3xl">Drop a nugget</h1>
        <p className="mt-2 text-sm text-muted">
          Subscribers to you receive this in their nuggets feed. Keep it short — a skill, a prompt,
          a resource.
        </p>
        <form onSubmit={publish} className="mt-6 space-y-4">
          <Field label="Title">
            <TextInput value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Field>
          <Field label="Body">
            <TextArea rows={6} value={body} onChange={(e) => setBody(e.target.value)} required />
          </Field>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <PrimaryButton type="submit">Publish to subscribers</PrimaryButton>
        </form>
      </div>
      <div className="space-y-3">
        {nuggets.map((n) => (
          <Card key={n.id}>
            <p className="text-xs text-muted">{new Date(n.created_at).toLocaleString()}</p>
            <h2 className="mt-1 font-semibold">{n.title}</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{n.body}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
