"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BackButton, NavButton } from "@/components/NavControls";
import { PageLoading } from "@/components/PageLoading";
import { Card, PrimaryButton, TextInput } from "@/components/Ui";
import { createClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export default function SessionChatPage() {
  const { id } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      setUserId(auth.user.id);

      const { data: session } = await supabase.from("sessions").select("*").eq("id", id).maybeSingle();
      if (!session) {
        setError("Session not found");
        return;
      }
      if (session.modality && session.modality !== "chat") {
        setError("This session is a video Meet, not chat.");
        return;
      }

      const { data: rows } = await supabase
        .from("session_messages")
        .select("id, sender_id, body, created_at")
        .eq("session_id", id)
        .order("created_at");
      setMessages((rows as Message[]) ?? []);
      setReady(true);

      channel = supabase
        .channel(`session-chat-${id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "session_messages", filter: `session_id=eq.${id}` },
          (payload) => {
            const row = payload.new as Message;
            setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
          },
        )
        .subscribe();
    })();

    return () => {
      if (channel) void createClient().removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !body.trim()) return;
    const text = body.trim();
    setBody("");
    const supabase = createClient();
    const { error: insertError } = await supabase.from("session_messages").insert({
      session_id: id,
      sender_id: userId,
      body: text,
    });
    if (insertError) setError(insertError.message);
  }

  if (error && !ready) {
    return (
      <div className="space-y-4">
        <BackButton href="/app/sessions" label="Sessions" />
        <p className="text-danger">{error}</p>
      </div>
    );
  }

  if (!ready) {
    return <PageLoading label="Opening chat…" />;
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col" style={{ minHeight: "70vh" }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <BackButton href="/app/sessions" label="Sessions" />
          <h1 className="font-display mt-2 text-3xl">Chat session</h1>
          <p className="mt-1 text-sm text-muted">Secure messaging with your professional for this slot.</p>
        </div>
        <NavButton href="/app/sessions">All sessions</NavButton>
      </div>
      <Card className="mt-6 flex flex-1 flex-col p-0">
        <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: "50vh" }}>
          {messages.length === 0 ? (
            <p className="text-sm text-muted">Say hello to start the check-in.</p>
          ) : null}
          {messages.map((m) => {
            const mine = m.sender_id === userId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-6 ${
                    mine ? "bg-navy text-paper" : "bg-sky-soft text-ink"
                  }`}
                >
                  {m.body}
                  <p className={`mt-1 text-[10px] ${mine ? "text-paper/70" : "text-muted"}`}>
                    {new Date(m.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={(e) => void send(e)} className="flex gap-2 border-t border-line p-3">
          <TextInput
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a message…"
            className="flex-1"
          />
          <PrimaryButton type="submit" disabled={!body.trim()}>
            Send
          </PrimaryButton>
        </form>
      </Card>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
