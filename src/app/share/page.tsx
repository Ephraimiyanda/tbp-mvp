"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { Logo } from "@/components/Logo";
import { useOrigin } from "@/lib/storage";

export default function SharePage() {
  const [copied, setCopied] = useState(false);
  const url = useOrigin();

  return (
    <div className="flex min-h-full flex-col bg-cream">
      <header className="bg-forest">
        <div className="mx-auto flex h-16 max-w-2xl items-center px-5">
          <Logo inverted />
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-12">
        <h1 className="font-display text-4xl font-light">Share TBP with a classmate.</h1>
        <p className="mt-4 leading-7 text-muted">
          BetterHelp’s landing offers Couples and Teen. For campus, the third door is “I’m here
          for a friend.” You shouldn’t have to drag them through your own intake.
        </p>
        <div className="mt-8 rounded-2xl bg-white p-5 ring-1 ring-line">
          <p className="text-xs uppercase tracking-wider text-muted">Prototype link</p>
          <p className="mt-2 break-all font-mono text-sm">{url || "Loading…"}</p>
          <button
            type="button"
            className="mt-4 rounded-md bg-mint px-4 py-2 text-sm font-semibold text-forest"
            onClick={async () => {
              if (!url) return;
              try {
                await navigator.clipboard.writeText(url);
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
          >
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
        <p className="mt-8 text-sm text-muted">
          If you also want support yourself, start the individual intake.
        </p>
        <Link
          href="/get-started?path=counseling"
          className="mt-4 inline-block font-semibold text-leaf-deep"
        >
          Get started for me
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
