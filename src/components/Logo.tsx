import Link from "next/link";

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 no-underline">
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
          inverted ? "bg-mint text-forest" : "bg-forest text-mint"
        }`}
        aria-hidden
      >
        t
      </span>
      <span
        className={`font-display text-xl font-semibold tracking-tight ${
          inverted ? "text-cream" : "text-forest"
        }`}
      >
        tbp
      </span>
    </Link>
  );
}
