export function CounselorAvatar({
  initials,
  color,
  size = "md",
}: {
  initials: string;
  color: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "lg" ? "h-24 w-24 text-2xl" : size === "sm" ? "h-10 w-10 text-sm" : "h-16 w-16 text-lg";
  return (
    <div
      className={`${dim} flex shrink-0 items-center justify-center rounded-full font-display font-semibold text-cream`}
      style={{ backgroundColor: color }}
      aria-hidden
    >
      {initials}
    </div>
  );
}
