import React, { useEffect, useState } from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { Avatar } from './Avatar';
import { useUI } from '../ui';
import { haptic } from '../tokens';
import { useLevelIdentity } from '../useLevelIdentity';
import { LevelMapSheet } from './LevelMapSheet';
import { bandOf, levelAccent, levelGlow } from '../types/levelIdentity';

interface ProfileChipProps {
  name: string;
  seed: number;
  /** Legacy fallback for the level code; the live value comes from useUI(). */
  caption: string;
  label: string;
  /** Kept for API compatibility — the chip now opens the level sheet itself. */
  onClick?: () => void;
}

const RING_SIZE = 38;
const RING_RADIUS = 17;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/**
 * Top-left identity block: avatar wrapped in the level ring + name + level badge.
 *
 * Clean Apple minimalism:
 *   • Single name without redundant dot indicators;
 *   • Elegant micro-pill level badge + level rank title;
 *   • Smooth tap target that opens the level map.
 */
export function ProfileChip({ name, seed, caption, label }: ProfileChipProps) {
  const ui = useUI();
  const { meta, percent } = useLevelIdentity();
  const accent = levelAccent(meta, ui.dark);
  const band = bandOf(meta);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setDrawn(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const arc = drawn ? (percent ?? 0) : 0;
  const dashOffset = RING_LENGTH * (1 - arc / 100);

  function handleOpenMap() {
    haptic('light');
    ui.openSheet({
      key: 'level-map-sheet',
      detent: 'large',
      node: <LevelMapSheet />
    });
  }

  return (
    <button
      type="button"
      onClick={handleOpenMap}
      aria-label={label}
      className="group flex h-[44px] max-w-[240px] items-center gap-2.5 rounded-full pl-0.5 pr-2.5 transition-all duration-150 ease-out hover:bg-slate-100/60 active:scale-[0.97] dark:hover:bg-slate-800/60"
    >
      {/* ── 1. Avatar with Level Progress Ring ── */}
      <div
        className="relative shrink-0"
        style={{ width: RING_SIZE, height: RING_SIZE }}
      >
        <svg
          aria-hidden="true"
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          width={RING_SIZE}
          height={RING_SIZE}
          className="absolute inset-0 -rotate-90"
        >
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            fill="none"
            stroke={levelGlow(meta, ui.dark ? 0.28 : 0.16)}
            strokeWidth="2"
          />
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            fill="none"
            stroke={accent}
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={RING_LENGTH}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.32,0.72,0,1), stroke 400ms ease-out' }}
          />
        </svg>

        <div
          className="absolute inset-[3px] rounded-full transition-shadow duration-500"
          style={{ boxShadow: `0 0 ${7 + band.tier * 3}px ${levelGlow(meta, ui.dark ? 0.34 : 0.2)}` }}
        >
          <Avatar name={name} seed={seed} size={32} />
        </div>
      </div>

      {/* ── 2. User Name & Sleek Apple Level Pill Badge ── */}
      <div className="flex min-w-0 flex-col items-start text-left">
        <span className="truncate font-sans text-[13px] font-bold leading-none text-foreground">
          {name}
        </span>

        <div className="mt-1 flex items-center gap-1.5">
          <span
            className="flex items-center justify-center rounded px-1.5 py-[2px] font-sans text-[10px] font-extrabold leading-none tabular-nums"
            style={{
              backgroundColor: `hsl(${band.glow} / ${ui.dark ? 0.22 : 0.12})`,
              color: accent
            }}
          >
            {meta.code || caption}
          </span>
          <span className="truncate font-sans text-[11px] font-medium leading-none text-mutedfg">
            {meta.title || band.shortTitle}
          </span>
          <ChevronDownIcon
            size={11}
            className="shrink-0 text-slate-400 transition-colors group-hover:text-foreground"
          />
        </div>
      </div>
    </button>
  );
}
