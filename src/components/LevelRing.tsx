import React from 'react';

interface LevelRingProps {
  level: number;
  /** 0..1 progress toward the next level */
  progress: number;
  size?: number;
}

/** Compact level badge: number inside a luminous progress ring. */
export function LevelRing({ level, progress, size = 46 }: LevelRingProps) {
  const stroke = 3.5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}>

      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke} />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0.04, progress))}
          style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(0.23,1,0.32,1)' }} />

      </svg>
      <span className="absolute font-display text-footnote font-bold tabular-nums text-foreground">
        {level}
      </span>
    </span>);

}
