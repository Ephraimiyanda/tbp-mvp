"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PrimaryButton } from "@/components/Buttons";
import { CounselorAvatar } from "@/components/CounselorAvatar";
import { FunnelHeader } from "@/components/SiteHeader";
import { getCounselor } from "@/lib/counselors";
import { matchReasons, pickMatch } from "@/lib/matching";
import { saveSession, uid, useIsClient, useSession } from "@/lib/storage";
import type { SessionState } from "@/lib/types";

export function MatchClient() {
  const router = useRouter();
  const isClient = useIsClient();
  const session = useSession();
  const counselor =
    (session?.counselorId && getCounselor(session.counselorId)) ||
    (session ? pickMatch(session) : null);

  useEffect(() => {
    if (!isClient) return;
    if (!session?.consented) {
      router.replace("/get-started?path=counseling");
      return;
    }
    if (!counselor) {
      router.replace("/get-started?path=counseling");
    }
  }, [isClient, session, counselor, router]);

  function confirm() {
    if (!session || !counselor) return;
    const alreadyGreeted = session.messages.some((m) => m.from === "counselor");
    const next: SessionState = {
      ...session,
      counselorId: counselor.id,
      messages: alreadyGreeted
        ? session.messages
        : [
            {
              id: uid(),
              from: "counselor",
              text: `Hi ${session.firstName ?? "there"} — I’m ${counselor.name.split(" ")[0]}. I read your intake. We can start here, in messages, whenever you’re ready. This is a prototype thread, but the shape is the real product.`,
              at: new Date().toISOString(),
            },
          ],
    };
    saveSession(next);
    router.push("/home");
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
    return (
      <div className="flex min-h-full flex-col bg-cream">
        <FunnelHeader />
      </div>
    );
  }

  const reasons = matchReasons(session, counselor.id);

  return (
    <div className="flex min-h-full flex-col bg-cream">
      <FunnelHeader progress={100} />
      <main className="mx-auto w-full max-w-xl flex-1 px-5 py-10">
        <p className="text-xs font-medium uppercase tracking-wider text-leaf-deep">
          Your match
        </p>
        <h1 className="font-display mt-2 text-3xl font-light">
          {session.firstName ? `${session.firstName}, meet ${counselor.name.split(" ")[0]}.` : counselor.name}
        </h1>
        <div className="mt-8 rounded-2xl border border-line bg-white p-6">
          <div className="flex gap-4">
            <CounselorAvatar initials={counselor.initials} color={counselor.color} size="lg" />
            <div>
              <h2 className="font-display text-xl font-semibold">{counselor.name}</h2>
              <p className="text-sm text-muted">{counselor.credentials}</p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6">{counselor.bio}</p>
          <p className="mt-3 text-sm leading-6 text-muted">{counselor.approach}</p>
          <ul className="mt-5 space-y-2">
            {reasons.map((r) => (
              <li key={r} className="flex gap-2 text-sm text-leaf-deep">
                <span aria-hidden>•</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={rematch} className="text-sm font-medium text-muted hover:text-ink">
            This isn’t the right fit
          </button>
          <PrimaryButton onClick={confirm}>Confirm this counselor</PrimaryButton>
        </div>
        <p className="mt-6 text-xs text-muted">
          Switching is free and doesn’t require an explanation — same mechanic as BetterHelp.{" "}
          <Link href="/crisis" className="underline">
            Need crisis resources instead?
          </Link>
        </p>
      </main>
    </div>
  );
}
