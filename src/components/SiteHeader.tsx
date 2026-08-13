import Link from "next/link";
import { Logo } from "./Logo";

export function SiteHeader({
  variant = "dark",
}: {
  variant?: "dark" | "light";
}) {
  const dark = variant === "dark";
  return (
    <header
      className={`sticky top-0 z-30 ${
        dark ? "bg-forest text-cream" : "bg-cream/90 text-ink backdrop-blur"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo inverted={dark} />
        <nav className="hidden items-center gap-7 text-sm md:flex">
          <a href="#how" className={dark ? "text-cream/80 hover:text-cream" : "text-muted hover:text-ink"}>
            How it works
          </a>
          <a href="#faq" className={dark ? "text-cream/80 hover:text-cream" : "text-muted hover:text-ink"}>
            FAQ
          </a>
          <Link href="/login" className={dark ? "text-cream/80 hover:text-cream" : "text-muted hover:text-ink"}>
            Log in
          </Link>
          <Link
            href="/get-started?path=counseling"
            className={`rounded-md px-4 py-2 text-sm font-semibold ${
              dark
                ? "bg-mint text-forest hover:bg-white"
                : "bg-forest text-cream hover:bg-forest-deep"
            }`}
          >
            Get started
          </Link>
        </nav>
        <Link
          href="/get-started?path=counseling"
          className={`md:hidden rounded-md px-3 py-1.5 text-sm font-semibold ${
            dark ? "bg-mint text-forest" : "bg-forest text-cream"
          }`}
        >
          Get started
        </Link>
      </div>
    </header>
  );
}

export function FunnelHeader({ progress }: { progress?: number }) {
  return (
    <header className="border-b border-line bg-cream">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
        <Logo />
        <p className="text-xs text-muted">Prototype · not a care service</p>
      </div>
      {typeof progress === "number" ? (
        <div className="h-1 w-full bg-sand">
          <div
            className="h-1 bg-leaf-deep transition-[width] duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      ) : null}
    </header>
  );
}
