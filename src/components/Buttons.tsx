import type { ReactNode } from "react";

export function OptionButton({
  selected,
  onClick,
  children,
  hint,
}: {
  selected?: boolean;
  onClick: () => void;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg border px-5 py-4 text-left transition ${
        selected
          ? "border-leaf-deep bg-mint/40 ring-2 ring-leaf-deep/30"
          : "border-line bg-white hover:border-forest/40"
      }`}
    >
      <span className="block font-medium text-ink">{children}</span>
      {hint ? <span className="mt-1 block text-sm text-muted">{hint}</span> : null}
    </button>
  );
}

export function PrimaryButton({
  children,
  onClick,
  href,
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const cls = `inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold transition ${
    disabled
      ? "cursor-not-allowed bg-line text-muted"
      : "bg-mint text-forest hover:bg-[#b7e6ae]"
  }`;
  if (href && !disabled) {
    return (
      <a className={cls} href={href}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm font-medium text-muted hover:text-ink"
    >
      {children}
    </button>
  );
}
