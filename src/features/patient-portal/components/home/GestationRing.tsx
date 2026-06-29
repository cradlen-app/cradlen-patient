"use client";

/**
 * Circular gestational-progress ring for the pregnancy hero, e.g. "12 / 40 wks".
 * Pure SVG (no chart lib): a faint track + a brand-secondary arc whose length is
 * `current / total`. Direction-agnostic — the arc starts at 12 o'clock and the
 * numerals are centred, so it reads correctly in both LTR and RTL.
 */
export function GestationRing({
  current,
  total = 40,
  unit,
  size = 116,
  strokeWidth = 8,
}: {
  current: number;
  total?: number;
  /** Short unit label under the count, e.g. "wks". */
  unit: string;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = total > 0 ? Math.min(Math.max(current / total, 0), 1) : 0;
  const dash = circumference * fraction;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${current} / ${total} ${unit}`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-white/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          className="text-brand-secondary transition-[stroke-dasharray] duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span className="text-3xl font-bold leading-none">{current}</span>
        <span className="mt-1 text-[11px] text-white/70">
          / {total} {unit}
        </span>
      </div>
    </div>
  );
}
