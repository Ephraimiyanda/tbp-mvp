type WaveTone = "navy-to-mist" | "mist-to-white" | "white-to-mist" | "mist-to-navy" | "white-to-navy";

const FILLS: Record<WaveTone, { layers: string[]; base: string }> = {
  "navy-to-mist": {
    layers: ["#163e7a", "#2b6cb0", "#7ba8d4"],
    base: "#eaf2fb",
  },
  "mist-to-white": {
    layers: ["#7ba8d4", "#2b6cb0", "#c9def5"],
    base: "#ffffff",
  },
  "white-to-mist": {
    layers: ["#c9def5", "#7ba8d4", "#2b6cb0"],
    base: "#eaf2fb",
  },
  "mist-to-navy": {
    layers: ["#7ba8d4", "#2b6cb0", "#163e7a"],
    base: "#0b2e6b",
  },
  "white-to-navy": {
    layers: ["#c9def5", "#7ba8d4", "#2b6cb0"],
    base: "#081f4a",
  },
};

const PATHS = [
  "M0 36 C 180 8, 360 64, 540 28 C 720 0, 900 52, 1080 24 C 1260 4, 1380 40, 1440 22 L 1440 72 L 0 72 Z",
  "M0 44 C 200 16, 380 70, 560 36 C 740 8, 920 60, 1100 32 C 1280 10, 1380 48, 1440 30 L 1440 72 L 0 72 Z",
  "M0 50 C 160 28, 340 68, 520 42 C 700 18, 880 64, 1060 38 C 1240 16, 1360 54, 1440 40 L 1440 72 L 0 72 Z",
];

const LINE_PATHS = [
  "M0 14 C 150 2, 300 26, 450 14 C 600 2, 750 26, 900 14 C 1050 2, 1200 26, 1440 14",
  "M0 22 C 160 10, 320 34, 480 22 C 640 10, 800 34, 960 22 C 1120 10, 1280 34, 1440 22",
  "M0 30 C 140 18, 280 42, 420 30 C 560 18, 700 42, 840 30 C 980 18, 1120 42, 1440 30",
];

export function WaveDivider({
  tone,
  className = "",
}: {
  tone: WaveTone;
  className?: string;
}) {
  const { layers, base } = FILLS[tone];
  return (
    <div className={`relative leading-[0] ${className}`} aria-hidden>
      <svg viewBox="0 0 1440 72" className="block h-12 w-full md:h-16" preserveAspectRatio="none">
        {PATHS.map((d, i) => (
          <path key={d} d={d} fill={layers[i]} opacity={0.28 + i * 0.12} />
        ))}
        <path d={PATHS[2]} fill={base} />
      </svg>
    </div>
  );
}

export function FineWaves({
  onDark = false,
  className = "",
}: {
  onDark?: boolean;
  className?: string;
}) {
  const strokes = onDark ? ["#c9def5", "#7ba8d4", "#2b6cb0"] : ["#0b2e6b", "#2b6cb0", "#7ba8d4"];
  return (
    <div className={`relative bg-transparent leading-[0] ${className}`} aria-hidden>
      <svg viewBox="0 0 1440 40" className="block h-8 w-full md:h-10" preserveAspectRatio="none">
        {LINE_PATHS.map((d, i) => (
          <path
            key={d}
            d={d}
            fill="none"
            stroke={strokes[i]}
            strokeWidth="1.25"
            opacity={0.35 + i * 0.18}
            strokeLinecap="round"
          />
        ))}
      </svg>
    </div>
  );
}
