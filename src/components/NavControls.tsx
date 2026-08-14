"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export function BackButton({
  href,
  label = "Back",
}: {
  href?: string;
  label?: string;
}) {
  const router = useRouter();
  const className =
    "inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-muted transition hover:text-navy";

  if (href) {
    return (
      <Link href={href} className={className}>
        ← {label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => router.back()} className={className}>
      ← {label}
    </button>
  );
}

export function NavButton({
  href,
  children,
  className = "",
  variant = "secondary",
}: {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const styles =
    variant === "primary"
      ? "bg-navy text-paper hover:bg-navy-soft"
      : variant === "ghost"
        ? "bg-transparent text-navy hover:bg-sky-soft"
        : "border border-navy/20 bg-white text-navy hover:border-navy hover:bg-sky-soft";

  return (
    <Link
      href={href}
      className={`inline-flex cursor-pointer items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition ${styles} ${className}`}
    >
      {children}
    </Link>
  );
}

export function PressableCard({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`block cursor-pointer rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:border-sky hover:bg-sky-soft/40 ${className}`}
    >
      {children}
    </Link>
  );
}

/** Care shortcuts shown on matched-professional pages */
export function CareTabs({ className = "" }: { className?: string }) {
  return (
    <nav className={`flex flex-wrap gap-2 ${className}`} aria-label="Care sections">
      <NavButton href="/app/sessions">Sessions</NavButton>
      <NavButton href="/app/groups">Peer groups</NavButton>
      <NavButton href="/app/nuggets">Nuggets</NavButton>
    </nav>
  );
}
