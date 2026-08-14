"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PlanBuilder } from "@/components/PlanBuilder";
import { PageLoading } from "@/components/PageLoading";
import { createClient } from "@/lib/supabase/client";

export default function ProPlanPage() {
  const { id } = useParams<{ id: string }>();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState("your student");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/sessions/${id}`);
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        session?: { student_id: string };
      };
      if (!res.ok || !json.session) {
        setError(json.error || "Session not found");
        return;
      }
      setStudentId(json.session.student_id);
      const supabase = createClient();
      const { data } = await supabase.from("profiles").select("full_name").eq("id", json.session.student_id).maybeSingle();
      setStudentName(data?.full_name || "your student");
    })();
  }, [id]);

  if (error) return <p className="text-danger">{error}</p>;
  if (!studentId) return <PageLoading label="Loading plan…" />;
  return <PlanBuilder sessionId={id} studentName={studentName} backHref={`/pro/clients/${studentId}`} />;
}
