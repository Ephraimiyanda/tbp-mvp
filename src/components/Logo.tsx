import Link from "next/link";

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link href="/" className="flex cursor-pointer items-center gap-2 no-underline">
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full font-display text-lg ${
          inverted ? "bg-clay-soft text-navy" : "bg-navy text-clay-soft"
        }`}
        aria-hidden
      >
        m
      </span>
      <span className={`font-display text-xl tracking-tight ${inverted ? "text-paper" : "text-navy"}`}>
        myalo
      </span>
    </Link>
  );
}
