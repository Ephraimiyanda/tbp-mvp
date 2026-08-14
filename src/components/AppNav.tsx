"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { WaveJoin } from "@/components/WaveDivider";
import { createClient } from "@/lib/supabase/client";

export function AppNav({
  role,
  name,
}: {
  role: "student" | "professional";
  name: string;
}) {
  const path = usePathname();
  const router = useRouter();
  const links =
    role === "professional"
      ? [
          ["/pro", "Clients"],
          ["/pro/schedule", "Schedule"],
          ["/pro/nuggets", "Nuggets"],
          ["/pro/groups", "Groups"],
        ]
      : [
          ["/app", "Home"],
          ["/app/match", "Match"],
          ["/app/sessions", "Sessions"],
          ["/app/groups", "Groups"],
          ["/app/nuggets", "Nuggets"],
        ];

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <header className="bg-navy text-paper">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-5 py-3">
          <Logo inverted />
          <nav className="flex flex-1 flex-wrap gap-1">
            {links.map(([href, label]) => {
              const active =
                path === href ||
                (href === "/app/match" &&
                  (path.startsWith("/app/match") || path.startsWith("/app/subscribe"))) ||
                (href !== "/app" && href !== "/pro" && href !== "/app/match" && path.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`cursor-pointer rounded-full px-3 py-1.5 text-sm ${active ? "bg-clay text-navy" : "text-paper/80 hover:bg-white/10 hover:text-paper"}`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
          <span className="text-sm text-paper/70">{name}</span>
          <button
            type="button"
            onClick={signOut}
            className="cursor-pointer rounded-full border border-danger/40 bg-danger/25 px-3.5 py-1.5 text-sm font-semibold text-[#f6dede] shadow-sm transition hover:border-danger/60 hover:bg-danger/40 hover:text-paper"
          >
            Log out
          </button>
        </div>
      </header>
      <WaveJoin from="navy" to="white" />
    </>
  );
}
