import React from 'react';
import type { LevelBandLetter } from '../types/levelIdentity';

/**
 * Level signatures — one abstract geometric mark per band, drawn as SVG with
 * currentColor. The set reads as a journey:
 *
 *   A nuqta (dot) → B yo‘nalish (rising vector) → C nishon (target)
 *   → D yulduz (four-point star) → E halo (double ring)
 *
 * No emojis, no glyph fonts — these are part of the design system.
 */

interface LevelSigilProps {
  band: LevelBandLetter;
  /** Square size in px. */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function LevelSigil({ band, size = 12, className, style }: LevelSigilProps) {
  const stroke = 1.6;
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      width={size}
      height={size}
      className={['shrink-0', className || ''].join(' ')}
      style={style}
      fill="none"
    >
      {band === 'A' && <circle cx="6" cy="6" r="2.4" fill="currentColor" />}

      {band === 'B' && (
        <>
          <path
            d="M2.8 9.2 L8.4 3.6"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          <circle cx="9.2" cy="2.8" r="1.5" fill="currentColor" />
        </>
      )}

      {band === 'C' && (
        <>
          <circle cx="6" cy="6" r="4.2" stroke="currentColor" strokeWidth={stroke} />
          <circle cx="6" cy="6" r="1.7" fill="currentColor" />
        </>
      )}

      {band === 'D' && (
        <path
          d="M6 0.9 L7.3 4.7 L11.1 6 L7.3 7.3 L6 11.1 L4.7 7.3 L0.9 6 L4.7 4.7 Z"
          fill="currentColor"
        />
      )}

      {band === 'E' && (
        <>
          <circle cx="6" cy="6" r="4.6" stroke="currentColor" strokeWidth={1.3} />
          <circle cx="6" cy="6" r="2.2" stroke="currentColor" strokeWidth={1.3} />
        </>
      )}
    </svg>
  );
}

