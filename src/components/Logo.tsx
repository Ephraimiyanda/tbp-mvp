import Link from "next/link";

function WaterDrop({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M12 2.5C12 2.5 4.8 12.2 4.8 16.6a7.2 7.2 0 0 0 14.4 0C19.2 12.2 12 2.5 12 2.5Z"
      />
      <path
        fill="currentColor"
        opacity="0.28"
        d="M8.6 15.4c0-2.4 1.6-5.1 2.8-7.1-.4 2.6.5 5.1 2.4 6.8 1.1 1 1.7 2.2 1.7 3.5A5.2 5.2 0 0 1 8.6 15.4Z"
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
