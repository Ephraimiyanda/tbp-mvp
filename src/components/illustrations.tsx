export function HeroConversation({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 560 480"
      className={`h-auto w-full ${className}`}
      role="img"
      aria-label="A student and a professional talking together"
    >
      <ellipse cx="290" cy="250" rx="230" ry="190" fill="#c9def5" opacity="0.18" />
      <ellipse cx="300" cy="268" rx="168" ry="128" fill="#7ba8d4" opacity="0.16" />
      <rect x="86" y="72" width="88" height="108" rx="16" fill="#eaf2fb" opacity="0.35" />
      <rect x="98" y="84" width="64" height="48" rx="8" fill="#c9def5" opacity="0.7" />
      <circle cx="130" cy="108" r="14" fill="#fff7e8" opacity="0.85" />
      <path d="M70 390 C 160 360, 400 360, 500 392" fill="none" stroke="#7ba8d4" strokeWidth="8" opacity="0.35" strokeLinecap="round" />
      <ellipse cx="280" cy="392" rx="150" ry="18" fill="#2b6cb0" opacity="0.22" />

      <g className="illu-float">
        <circle cx="168" cy="168" r="22" fill="#f3e6d8" />
        <path d="M150 162 c6-10 22-12 32-4" fill="#1a3a72" />
        <rect x="146" y="190" width="48" height="62" rx="18" fill="#c9def5" />
        <rect x="152" y="248" width="18" height="42" rx="8" fill="#eaf2fb" />
        <rect x="170" y="248" width="18" height="36" rx="8" fill="#eaf2fb" />
        <rect x="132" y="206" width="14" height="36" rx="7" fill="#f3e6d8" />
        <circle cx="196" cy="214" r="9" fill="#ffffff" />
      </g>

      <g className="illu-float-delayed">
        <circle cx="372" cy="158" r="24" fill="#f7e4d4" />
        <path d="M352 154 c8-14 32-14 40 0" fill="#0b2e6b" />
        <rect x="348" y="184" width="52" height="68" rx="18" fill="#ffffff" />
        <rect x="354" y="248" width="18" height="44" rx="8" fill="#c9def5" />
        <rect x="376" y="248" width="18" height="38" rx="8" fill="#c9def5" />
        <rect x="404" y="200" width="14" height="38" rx="7" fill="#f7e4d4" />
        <rect x="318" y="214" width="36" height="8" rx="4" fill="#7ba8d4" />
      </g>

      <g>
        <rect x="248" y="210" width="64" height="40" rx="14" fill="#ffffff" />
        <circle cx="264" cy="230" r="4" fill="#2b6cb0" />
        <circle cx="280" cy="230" r="4" fill="#2b6cb0" />
        <circle cx="296" cy="230" r="4" fill="#2b6cb0" />
      </g>

      <g>
        <rect x="430" y="268" width="10" height="86" rx="4" fill="#2b6cb0" />
        <ellipse cx="435" cy="262" rx="28" ry="18" fill="#7ba8d4" />
        <ellipse cx="418" cy="248" rx="16" ry="22" fill="#4a8bc4" />
        <ellipse cx="452" cy="246" rx="14" ry="20" fill="#c9def5" />
      </g>

      <circle cx="92" cy="300" r="6" fill="#c9def5" opacity="0.8" />
      <circle cx="478" cy="120" r="5" fill="#ffffff" opacity="0.5" />
      <circle cx="500" cy="168" r="3" fill="#7ba8d4" />
    </svg>
  );
}

export function HeroMatch({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 220"
      className={`h-auto w-full ${className}`}
      role="img"
      aria-label="Two people being matched"
    >
      <ellipse cx="160" cy="118" rx="130" ry="86" fill="#c9def5" opacity="0.2" />
      <circle cx="108" cy="100" r="36" fill="#eaf2fb" />
      <circle cx="108" cy="90" r="16" fill="#f3e6d8" />
      <path d="M92 86 c6-10 22-10 30 0" fill="#0b2e6b" />
      <rect x="90" y="108" width="36" height="28" rx="12" fill="#7ba8d4" />
      <circle cx="212" cy="100" r="36" fill="#ffffff" />
      <circle cx="212" cy="90" r="16" fill="#f7e4d4" />
      <path d="M196 86 c6-10 22-10 30 0" fill="#163e7a" />
      <rect x="194" y="108" width="36" height="28" rx="12" fill="#2b6cb0" />
      <path d="M144 108 C 152 92, 168 92, 176 108" fill="none" stroke="#c9def5" strokeWidth="3" strokeLinecap="round" />
      <circle cx="160" cy="86" r="8" fill="#c9def5" />
    </svg>
  );
}

export function StepQuestions({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 88" className={className} aria-hidden>
      <rect x="28" y="10" width="64" height="68" rx="10" fill="#eaf2fb" />
      <rect x="38" y="24" width="44" height="6" rx="3" fill="#2b6cb0" />
      <rect x="38" y="38" width="36" height="6" rx="3" fill="#7ba8d4" />
      <rect x="38" y="52" width="28" height="6" rx="3" fill="#c9def5" />
      <circle cx="22" cy="28" r="8" fill="#0b2e6b" />
    </svg>
  );
}

export function StepCalendar({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 88" className={className} aria-hidden>
      <rect x="26" y="18" width="68" height="54" rx="10" fill="#eaf2fb" />
      <rect x="26" y="18" width="68" height="16" rx="10" fill="#0b2e6b" />
      <circle cx="46" cy="50" r="6" fill="#7ba8d4" />
      <circle cx="62" cy="50" r="6" fill="#2b6cb0" />
      <circle cx="78" cy="50" r="6" fill="#c9def5" />
    </svg>
  );
}

export function StepPeers({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 88" className={className} aria-hidden>
      <circle cx="44" cy="40" r="14" fill="#c9def5" />
      <circle cx="76" cy="40" r="14" fill="#7ba8d4" />
      <circle cx="60" cy="56" r="14" fill="#0b2e6b" />
      <circle cx="44" cy="34" r="6" fill="#f3e6d8" />
      <circle cx="76" cy="34" r="6" fill="#f7e4d4" />
      <circle cx="60" cy="50" r="6" fill="#eaf2fb" />
    </svg>
  );
}
