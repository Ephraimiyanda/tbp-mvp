export function ProgressLine({
  done,
  total,
  label = "Ready for next session",
}: {
  done: number;
  total: number;
  label?: string;
}) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-navy">{label}</p>
        <p className="text-sm text-muted">
          {done}/{total || 0} exercises
        </p>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-navy transition-[width] duration-300"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={done}
          aria-valuemin={0}
          aria-valuemax={total || 0}
          aria-label={label}
        />
      </div>
    </div>
  );
}
