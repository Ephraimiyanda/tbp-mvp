"use client";

import { useEffect, useState } from "react";
import { PressableCard } from "@/components/NavControls";
import { createClient } from "@/lib/supabase/client";
import { concernLabel, type CarePlan, type Profile, type Subscription } from "@/lib/types";

type ClientRow = Subscription & {
  student?: Profile;
  carePlan?: CarePlan | null;
};

export default function ProHome() {
  const [clients, setClients] = useState<ClientRow[]>([]);

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("*, profiles:student_id(*)")
        .eq("professional_id", auth.user.id)
        .eq("status", "active");
      const rows = (subs ?? []) as (Subscription & { profiles?: Profile })[];
      const withPlans: ClientRow[] = [];
      for (const row of rows) {
        const { data: plan } = await supabase
          .from("care_plans")
          .select("*")
          .eq("subscription_id", row.id)
          .maybeSingle();
        withPlans.push({ ...row, student: row.profiles, carePlan: plan as CarePlan | null });
      }
      setClients(withPlans);
    })();
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl">Clients</h1>
      <p className="mt-2 text-sm text-muted">
        Students appear here after they subscribe. Open a client to set chat vs video, then send a
        Care Loop plan after each session.
      </p>
      <div className="mt-6 space-y-3">
        {clients.length === 0 ? <p className="text-muted">No subscribers yet.</p> : null}
        {clients.map((c) => (
          <PressableCard key={c.id} href={`/pro/clients/${c.student_id}`}>
            <p className="font-semibold">{c.student?.full_name ?? "Student"}</p>
            <p className="text-sm text-muted">
              {c.carePlan
                ? `${concernLabel(c.carePlan.primary_issue)} · ${c.carePlan.duration_weeks} weeks · ${c.carePlan.session_target} sessions`
                : "Student plan"}
              {c.session_type ? ` · ${c.session_type === "chat" ? "Chat" : "Video"}` : ""}
            </p>
            <p className="mt-3 text-sm font-semibold text-navy">Open client →</p>
          </PressableCard>
        ))}
      </div>
    </div>
  );
}
