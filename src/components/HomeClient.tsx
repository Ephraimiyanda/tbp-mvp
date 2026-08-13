"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CounselorAvatar } from "@/components/CounselorAvatar";
import { Logo } from "@/components/Logo";
import { getCounselor } from "@/lib/counselors";
import { getGroup } from "@/lib/groups";
import { clearSession, loadSession, saveSession, uid, useIsClient, useSession } from "@/lib/storage";
import type { Counselor, SessionState } from "@/lib/types";

type Tab = "messages" | "sessions" | "account";

export function HomeClient() {
  const router = useRouter();
  const isClient = useIsClient();
  const session = useSession();
  const [tab, setTab] = useState<Tab>("messages");
  const [draft, setDraft] = useState("");
  const counselor = session?.counselorId ? getCounselor(session.counselorId) ?? null : null;

  useEffect(() => {
    if (!isClient) return;
    if (!session?.consented) {
      router.replace("/get-started?path=counseling");
      return;
    }
    if (session.path === "peer" && !session.counselorId) {
      router.replace("/peer");
      return;
    }
    if (!session.counselorId) {
      router.replace("/matching");
    }
  }, [isClient, session, router]);

  function persist(next: SessionState) {
    saveSession(next);
  }

  function send() {
    if (!session || !counselor || !draft.trim()) return;
    const studentMsg = {
      id: uid(),
      from: "student" as const,
      text: draft.trim(),
      at: new Date().toISOString(),
    };
    persist({ ...session, messages: [...session.messages, studentMsg] });
    setDraft("");
    window.setTimeout(() => {
      const latest = loadSession();
      if (!latest) return;
      const reply = {
        id: uid(),
        from: "counselor" as const,
        text: scriptedReply(counselor.name.split(" ")[0], latest.firstName),
        at: new Date().toISOString(),
      };
      saveSession({ ...latest, messages: [...latest.messages, reply] });
    }, 900);
  }

  function book(label: string) {
    if (!session) return;
    persist({ ...session, bookedSlot: { label } });
    setTab("sessions");
  }

  function rematch() {
    if (!session || !counselor) return;
    saveSession({
      ...session,
      skippedCounselorIds: [...session.skippedCounselorIds, counselor.id],
      counselorId: undefined,
      messages: [],
      bookedSlot: undefined,
    });
    router.push("/matching");
  }

  if (!session || !counselor) {
    return <div className="min-h-full bg-cream" />;
  }

  const group = session.peerGroupId ? getGroup(session.peerGroupId) : undefined;

  return (
    <div className="flex min-h-full flex-col bg-cream md:flex-row">
      <aside className="border-b border-line bg-white md:w-56 md:border-b-0 md:border-r">
        <div className="flex h-14 items-center px-5">
          <Logo />
        </div>
        <nav className="flex gap-1 px-3 pb-3 md:flex-col">
          {(
            [
              ["messages", "Messages"],
              ["sessions", "Sessions"],
              ["account", "Account"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-md px-3 py-2 text-left text-sm ${
                tab === id ? "bg-sand font-semibold text-forest" : "text-muted hover:bg-sand/60"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-line bg-white px-5 py-3">
          <CounselorAvatar initials={counselor.initials} color={counselor.color} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-semibold">{counselor.name}</p>
            <p className="text-xs text-muted">{counselor.credentials}</p>
          </div>
          <span className="ml-auto rounded-full bg-sand px-2.5 py-1 text-xs text-muted">
            Prototype thread
          </span>
        </header>

        {tab === "messages" ? (
          <Messages
            session={session}
            draft={draft}
            setDraft={setDraft}
            send={send}
            group={group}
          />
        ) : null}
        {tab === "sessions" ? (
          <Sessions session={session} counselor={counselor} book={book} />
        ) : null}
        {tab === "account" ? (
          <Account session={session} rematch={rematch} />
        ) : null}
      </div>
    </div>
  );
}

function Messages({
  session,
  draft,
  setDraft,
  send,
  group,
}: {
  session: SessionState;
  draft: string;
  setDraft: (v: string) => void;
  send: () => void;
  group: ReturnType<typeof getGroup>;
}) {
  return (
    <div className="flex min-h-[60vh] flex-1 flex-col">
      {group ? (
        <div className="border-b border-line bg-sand px-5 py-3 text-sm">
          You’re in <span className="font-semibold">{group.name}</span> · {group.size}/{group.cap}{" "}
          members. Group chat is a teaser in this prototype.
        </div>
      ) : (
        <div className="border-b border-line bg-sand px-5 py-3 text-sm">
          Want peers too?{" "}
          <Link href="/peer" className="font-semibold text-leaf-deep underline">
            See a suggested group
          </Link>
        </div>
      )}
      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-6">
        {session.messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
              m.from === "student"
                ? "ml-auto bg-forest text-cream"
                : "bg-white text-ink shadow-sm ring-1 ring-line"
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>
      <form
        className="flex gap-2 border-t border-line bg-white p-4"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          className="flex-1 rounded-lg border border-line px-4 py-3 text-sm outline-none ring-leaf-deep/30 focus:ring-2"
          placeholder="Write a message…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button
          type="submit"
          className="rounded-md bg-mint px-4 py-3 text-sm font-semibold text-forest"
        >
          Send
        </button>
      </form>
    </div>
  );
}

function Sessions({
  session,
  counselor,
  book,
}: {
  session: SessionState;
  counselor: Counselor;
  book: (label: string) => void;
}) {
  return (
    <div className="px-5 py-8">
      <h2 className="font-display text-2xl font-light">Live sessions</h2>
      <p className="mt-2 max-w-lg text-sm text-muted">
        No real video in this prototype. Picking a slot confirms a fake booking so you can feel the
        BetterHelp “schedule when it suits you” step.
      </p>
      {session.bookedSlot ? (
        <div className="mt-6 rounded-2xl bg-mint/40 p-5">
          <p className="font-semibold">Booked · {session.bookedSlot.label}</p>
          <p className="mt-1 text-sm text-muted">
            With {counselor.name}. This would open a video room in a later build.
          </p>
        </div>
      ) : null}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {counselor.slots.map((slot) => (
          <button
            key={slot}
            type="button"
            onClick={() => book(slot)}
            className={`rounded-lg border px-4 py-3 text-left text-sm ${
              session.bookedSlot?.label === slot
                ? "border-leaf-deep bg-mint/50"
                : "border-line bg-white hover:border-forest/40"
            }`}
          >
            {slot}
          </button>
        ))}
      </div>
    </div>
  );
}

function Account({
  session,
  rematch,
}: {
  session: SessionState;
  rematch: () => void;
}) {
  const router = useRouter();
  return (
    <div className="px-5 py-8">
      <h2 className="font-display text-2xl font-light">Account</h2>
      <dl className="mt-6 space-y-3 text-sm">
        <div>
          <dt className="text-muted">Name</dt>
          <dd className="font-medium">{session.firstName}</dd>
        </div>
        <div>
          <dt className="text-muted">Email</dt>
          <dd className="font-medium">{session.email}</dd>
        </div>
        <div>
          <dt className="text-muted">Year</dt>
          <dd className="font-medium">{session.year}</dd>
        </div>
      </dl>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={rematch}
          className="rounded-md bg-forest px-4 py-3 text-sm font-semibold text-cream"
        >
          This isn’t the right fit
        </button>
        <button
          type="button"
          onClick={() => {
            clearSession();
            router.push("/");
          }}
          className="rounded-md border border-line px-4 py-3 text-sm font-medium"
        >
          Reset demo
        </button>
      </div>
      <p className="mt-6 text-xs text-muted">
        Stored only in this browser.{" "}
        <Link href="/crisis" className="underline">
          Crisis resources
        </Link>
      </p>
    </div>
  );
}

function scriptedReply(counselorFirst: string, studentName?: string) {
  return `Thanks for writing, ${studentName ?? "there"}. I’m ${counselorFirst}. In a live product I’d reply within a weekday or two. Here, this is an automatic note so you can feel the async thread. If this is urgent, please use campus emergency or the crisis resources — TBP isn’t that.`;
}
