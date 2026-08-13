import Link from "next/link";

function WaterDrop({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M12 3.2C12 3.2 5.5 11.2 5.5 16a6.5 6.5 0 0 0 13 0c0-4.8-6.5-12.8-6.5-12.8Z"
      />
      <path
        fill="currentColor"
        opacity="0.35"
        d="M9.2 15.2c0-1.8 1.1-3.8 2-5.4-.2 2.1.4 4.2 1.8 5.6.9.9 1.4 2 1.4 3.2a4.3 4.3 0 0 1-5.2-3.4Z"
      />
    </svg>
  );
}

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link href="/" className="flex cursor-pointer items-center gap-2 no-underline">
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full ${
          inverted ? "bg-clay-soft text-navy" : "bg-navy text-clay-soft"
        }`}
        aria-hidden
      >
        <WaterDrop className="h-4 w-4" />
      </span>
      <span className={`font-display text-xl tracking-tight ${inverted ? "text-paper" : "text-navy"}`}>
        myalo
      </span>
    </Link>
  );
}
