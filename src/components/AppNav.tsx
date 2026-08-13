"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
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
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-5 py-3">
        <Logo />
        <nav className="flex flex-1 flex-wrap gap-1">
          {links.map(([href, label]) => {
            const active = path === href || (href !== "/app" && href !== "/pro" && path.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-full px-3 py-1.5 text-sm ${active ? "bg-navy text-paper" : "text-muted hover:text-ink"}`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <span className="text-sm text-muted">{name}</span>
        <button type="button" onClick={signOut} className="text-sm text-muted hover:text-ink">
          Log out
        </button>
      </div>
    </header>
  );
}
