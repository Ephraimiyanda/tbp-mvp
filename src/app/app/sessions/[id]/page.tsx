"use client";

import { useParams } from "next/navigation";
import { SessionHub } from "@/components/SessionHub";

export default function StudentSessionPage() {
  const { id } = useParams<{ id: string }>();
  return <SessionHub sessionId={id} basePath="/app" />;
}
