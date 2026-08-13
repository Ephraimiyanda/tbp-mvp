const COLORS = {
  navy: "#0b2e6b",
  "navy-soft": "#081f4a",
  mist: "#eaf2fb",
  white: "#ffffff",
} as const;

export type WaveTone = keyof typeof COLORS;

/**
 * Filled shapes from the top of the viewBox down to a wavy bottom.
 * Accents sit slightly lower so a ribbon of blue peeks under the section color.
 * No stroke-only lines — those read as waves taped onto a rectangle.
 */
const CREST =
  "M0 0 H1440 V78 C 1260 148, 1100 28, 960 86 C 800 148, 640 32, 480 90 C 320 152, 160 36, 0 82 Z";
const ACCENT_LIGHT =
  "M0 0 H1440 V102 C 1260 164, 1100 52, 960 110 C 800 164, 640 56, 480 114 C 320 168, 160 60, 0 106 Z";
const ACCENT_DEEP =
  "M0 0 H1440 V122 C 1260 176, 1100 72, 960 128 C 800 176, 640 76, 480 132 C 320 180, 160 80, 0 126 Z";

/**
 * The section’s own bottom edge. Hang this as the last child of a colored block.
 * It overlaps the next block so that block’s straight top is hidden under the curve.
 */
export function WaveEdge({
  color,
  className = "",
}: {
  color: WaveTone;
  className?: string;
}) {
  return (
    <div
      className={`pointer-events-none relative z-10 -mt-px -mb-[5.5rem] h-[5.5rem] leading-[0] md:-mb-28 md:h-28 ${className}`}
      aria-hidden
    >
      <svg viewBox="0 0 1440 160" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <path d={ACCENT_DEEP} fill="#2b6cb0" opacity="0.42" />
        <path d={ACCENT_LIGHT} fill="#7ba8d4" opacity="0.5" />
        <path d={CREST} fill={COLORS[color]} />
      </svg>
    </div>
  );
}

/** Extra top padding so content sits below the overlapping wave from the previous section. */
export const WAVE_CLEAR = "pt-24 md:pt-32";
