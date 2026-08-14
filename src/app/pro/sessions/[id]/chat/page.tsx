"use client";

import { useParams } from "next/navigation";
import { SessionChat } from "@/components/SessionChat";

export default function ProSessionChatPage() {
  const { id } = useParams<{ id: string }>();
  return <SessionChat sessionId={id} basePath="/pro" />;
}
