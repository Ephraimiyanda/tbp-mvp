export function PageLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-4 px-5 text-center">
      <span
        className="h-9 w-9 animate-spin rounded-full border-2 border-clay border-t-navy"
        aria-hidden
      />
      <p className="text-sm font-medium text-muted">{label}</p>
    </div>
  );
}
