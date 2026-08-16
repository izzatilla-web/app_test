import React from 'react';
import { toneBg, toneFg } from '../tokens';
import type { Tone } from '../tokens';

interface StatusPillProps {
  tone: Tone;
  label: string;
  strikethrough?: boolean;
}

export function StatusPill({ tone, label, strikethrough }: StatusPillProps) {
  return (
    <span
      className="inline-flex items-center rounded-full px-[8px] py-[3px] font-sans text-caption font-medium tabular-nums"
      style={{
        backgroundColor: toneBg(tone),
        color: toneFg(tone),
        textDecoration: strikethrough ? 'line-through' : undefined
      }}>
      
      {label}
    </span>);

}