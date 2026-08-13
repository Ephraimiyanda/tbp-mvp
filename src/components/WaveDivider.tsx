const COLORS = {
  navy: "#0b2e6b",
  "navy-soft": "#081f4a",
  mist: "#eaf2fb",
  white: "#ffffff",
} as const;

export type WaveTone = keyof typeof COLORS;

/**
 * Layered fills from the top of the viewBox down to offset crests.
 * The outgoing color is the top layer; mid/sky ribbons peek under it;
 * the incoming color is the canvas underneath. Sections themselves
 * never meet on a straight edge.
 */
const VARIANTS = [
  {
    crest:
      "M0 0 H1440 V78 C 1260 148, 1100 28, 960 86 C 800 148, 640 32, 480 90 C 320 152, 160 36, 0 82 Z",
    light:
      "M0 0 H1440 V102 C 1260 164, 1100 52, 960 110 C 800 164, 640 56, 480 114 C 320 168, 160 60, 0 106 Z",
    deep:
      "M0 0 H1440 V122 C 1260 176, 1100 72, 960 128 C 800 176, 640 76, 480 132 C 320 180, 160 80, 0 126 Z",
  },
  {
    crest:
      "M0 0 H1440 V82 C 1280 24, 1120 150, 960 78 C 800 16, 640 146, 480 74 C 320 12, 160 140, 0 80 Z",
    light:
      "M0 0 H1440 V106 C 1280 48, 1120 166, 960 102 C 800 40, 640 162, 480 98 C 320 36, 160 156, 0 104 Z",
    deep:
      "M0 0 H1440 V126 C 1280 68, 1120 180, 960 122 C 800 60, 640 176, 480 118 C 320 56, 160 170, 0 124 Z",
  },
] as const;

/**
 * Sits between two blocks. Paints the outgoing color down to a wave, then the
 * incoming color beneath it — so the sections themselves never meet on a straight edge.
 */
export function WaveJoin({
  from,
  to,
  variant = 0,
  className = "",
}: {
  from: WaveTone;
  to: WaveTone;
  variant?: 0 | 1;
  className?: string;
}) {
  const v = VARIANTS[variant === 1 ? 1 : 0];
  return (
    <div
      className={`relative z-10 -my-px block w-full overflow-hidden leading-[0] ${className}`}
      style={{ background: COLORS[to] }}
      aria-hidden
    >
      <svg viewBox="0 0 1440 160" className="block h-20 w-full md:h-28" preserveAspectRatio="none">
        <path d={v.deep} fill="#2b6cb0" opacity="0.42" />
        <path d={v.light} fill="#7ba8d4" opacity="0.5" />
        <path d={v.crest} fill={COLORS[from]} />
      </svg>
    </div>
  );
}
