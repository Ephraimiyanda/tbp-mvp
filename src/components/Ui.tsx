import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

export function PrimaryButton({
  children,
  onClick,
  type = "button",
  disabled,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition ${
        disabled
          ? "cursor-not-allowed bg-line text-muted"
          : "cursor-pointer bg-clay text-navy shadow-sm hover:bg-sky-soft hover:shadow-md"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function OptionButton({
  selected,
  onClick,
  children,
}: {
  selected?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full cursor-pointer rounded-2xl border px-5 py-4 text-left transition ${
        selected
          ? "border-navy bg-clay-soft ring-2 ring-sky/50"
          : "border-line bg-white hover:border-sky hover:bg-sky-soft"
      }`}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block cursor-pointer text-sm font-medium">
      {label}
      <div className="mt-2">{children}</div>
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full cursor-text rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none ring-sky/30 focus:border-sky focus:ring-2 ${props.className ?? ""}`}
    />
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full cursor-text rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none ring-sky/30 focus:border-sky focus:ring-2 ${props.className ?? ""}`}
    />
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-white p-5 shadow-sm ${className}`}>{children}</div>;
}
