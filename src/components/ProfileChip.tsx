import React, { useEffect, useState } from 'react';
import { Avatar } from './Avatar';
import { useUI } from '../ui';
import { useLevelIdentity } from '../useLevelIdentity';
import { bandOf, levelAccent, levelGlow } from '../types/levelIdentity';

interface ProfileChipProps {
  name: string;
  seed: number;
  /** Legacy fallback for the level code; the live value comes from useUI(). */
  caption: string;
  label: string;
  onClick?: () => void;
}

const RING_SIZE = 38;
const RING_RADIUS = 17;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/**
 * Dynamic Status Rank titles based on student's current academic level.
 * Replaces duplicate level codes with exciting learner / gamer status ranks!
 */
export function getLevelRankTitle(code: string): string {
  const normalized = (code || '').toUpperCase().trim();
  switch (normalized) {
    case 'A1':
      return 'Boshlovchi';
    case 'A2':
      return 'Izlanuvchi';
    case 'A3':
      return 'Iqtidor';
    case 'B1':
      return 'Bilimdon';
    case 'B2':
      return 'Ekspert';
    case 'B3':
      return 'Usta (Master)';
    case 'C1':
      return 'Grandmaster';
    case 'C2':
      return 'Chempion';
    case 'C3':
      return 'Elita';
    case 'D1':
      return 'Afsonaviy';
    case 'D2':
      return 'Afsona (Legend)';
    case 'D3':
      return 'Olimpiada Qiroli';
    case 'E1':
    case 'E2':
    case 'E3':
      return 'Geometr';
    default:
      if (normalized.startsWith('A')) return 'Izlanuvchi';
      if (normalized.startsWith('B')) return 'Bilimdon';
      if (normalized.startsWith('C')) return 'Master';
      if (normalized.startsWith('D')) return 'Legend';
      return 'Izlanuvchi';
  }
}

/**
 * Top-left identity block: avatar with level progress ring + student name + dynamic Status Rank.
 * Clean, pure Apple minimalism without duplicate level codes.
 */
export function ProfileChip({ name, seed, caption, label }: ProfileChipProps) {
  const ui = useUI();
  const { meta, percent } = useLevelIdentity();
  const accent = levelAccent(meta, ui.dark);
  const band = bandOf(meta);
  const [drawn, setDrawn] = useState(false);

  const levelCode = meta.code || caption || 'A2';
  const rankTitle = getLevelRankTitle(levelCode);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setDrawn(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const arc = drawn ? (percent ?? 0) : 0;
  const dashOffset = RING_LENGTH * (1 - arc / 100);

  return (
    <div
      aria-label={label}
      className="flex h-[44px] max-w-[240px] items-center gap-2.5 rounded-full pl-0.5 pr-2.5 select-none"
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

      {/* ── 2. User Name & Dynamic Status Rank Badge ── */}
      <div className="flex min-w-0 flex-col items-start text-left">
        <span className="truncate font-sans text-[13px] font-bold leading-none text-foreground">
          {name}
        </span>

        <div className="mt-1 flex items-center">
          <span
            className="inline-flex items-center justify-center rounded-full px-2 py-[2px] font-sans text-[10px] font-extrabold tracking-wider uppercase leading-none shadow-2xs"
            style={{
              backgroundColor: `hsl(${band.glow} / ${ui.dark ? 0.24 : 0.12})`,
              color: accent
            }}
          >
            {rankTitle}
          </span>
        </div>
      </div>
    </div>
  );
}
