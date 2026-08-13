"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PrimaryButton } from "@/components/Buttons";
import { FunnelHeader } from "@/components/SiteHeader";
import { getGroup, suggestGroup } from "@/lib/groups";
import { saveSession, useIsClient, useSession } from "@/lib/storage";

export function PeerClient() {
  const router = useRouter();
  const isClient = useIsClient();
  const session = useSession();
  const group = session
    ? (session.peerGroupId && getGroup(session.peerGroupId)) || suggestGroup(session.concerns)
    : null;
  const joined = Boolean(session?.peerGroupId);

  useEffect(() => {
    if (!isClient) return;
    if (!session?.consented) {
      router.replace("/get-started?path=peer");
      return;
    }
    if (session.concerns.includes("crisis")) {
      router.replace("/crisis");
    }
  }, [isClient, session, router]);

  if (!session || !group) {
    return (
      <div className="flex min-h-full flex-col bg-cream">
        <FunnelHeader />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col bg-cream">
      <FunnelHeader progress={100} />
      <main className="mx-auto w-full max-w-xl flex-1 px-5 py-10">
        <p className="text-xs font-medium uppercase tracking-wider text-leaf-deep">Peer support</p>
        <h1 className="font-display mt-2 text-3xl font-light">A small group, not a forum.</h1>
        <p className="mt-3 text-sm text-muted">
          BetterHelp has no peer layer. This is TBP’s wedge — capped groups so check-ins stay
          personal. Chat itself is not built in this prototype.
        </p>
        <div className="mt-8 rounded-2xl border border-line bg-white p-6">
          <p className="text-xs uppercase tracking-wider text-muted">{group.tag}</p>
          <h2 className="font-display mt-1 text-2xl font-semibold">{group.name}</h2>
          <p className="mt-3 text-sm leading-6">{group.blurb}</p>
          <p className="mt-4 text-sm text-leaf-deep">
            {group.size}/{group.cap} members · facilitator TBD in a later build
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {joined ? (
            <p className="text-sm font-medium text-leaf-deep">You’re in (prototype join).</p>
          ) : (
            <PrimaryButton
              onClick={() => {
                saveSession({ ...session, peerGroupId: group.id });
              }}
            >
              Join this group
            </PrimaryButton>
          )}
          <Link href="/get-started?path=counseling" className="text-sm font-medium text-muted hover:text-ink">
            Also match with a counselor
          </Link>
        </div>
        {session.counselorId ? (
          <Link href="/home" className="mt-6 inline-block text-sm font-semibold text-leaf-deep">
            Back to messages
          </Link>
        ) : null}
      </main>
    </div>
  );
}
