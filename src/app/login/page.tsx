"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useSession } from "@/lib/storage";

export default function LoginPage() {
  const session = useSession();
  const resumeHref = session?.counselorId
    ? "/home"
    : session?.peerGroupId
      ? "/peer"
      : null;

  return (
    <div className="flex min-h-full flex-col bg-forest text-cream">
      <header className="mx-auto flex h-16 w-full max-w-md items-center px-5">
        <Logo inverted />
      </header>
      <main className="mx-auto w-full max-w-md flex-1 px-5 py-16">
        <h1 className="font-display text-3xl font-light">Log in</h1>
        <p className="mt-4 text-sm leading-6 text-cream/75">
          This prototype has no accounts. Session state lives in your browser. If you already
          finished intake on this device, you can jump back in.
        </p>
        {resumeHref ? (
          <Link
            href={resumeHref}
            className="mt-8 inline-flex rounded-md bg-mint px-5 py-3 text-sm font-semibold text-forest"
          >
            Continue where you left off
          </Link>
        ) : (
          <Link
            href="/get-started?path=counseling"
            className="mt-8 inline-flex rounded-md bg-mint px-5 py-3 text-sm font-semibold text-forest"
          >
            Get started instead
          </Link>
        )}
        <p className="mt-6">
          <Link href="/" className="text-sm text-cream/60 hover:text-cream">
            Back to home
          </Link>
        </p>
      </main>
    </div>
  );
}
