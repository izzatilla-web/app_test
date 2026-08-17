import React, { useEffect, useMemo, useState } from 'react';
import { haptic } from '../tokens';

interface Particle {
  id: number;
  type: 'star' | 'ribbon' | 'circle';
  color: string;
  size: number;
  tx: number;
  ty: number;
  rot: number;
  delay: number;
  duration: number;
}

// Exact color palette matching the 3D medal ribbon, gold stars, and celebration sparks
const CELEBRATION_COLORS = [
  '#F59E0B', // Gold
  '#FBBF24', // Amber
  '#8B5CF6', // Purple Ribbon
  '#7C3AED', // Deep Violet
  '#3B82F6', // Royal Blue
  '#60A5FA', // Sky Blue
  '#10B981', // Emerald
  '#06B6D4', // Turquoise
];

export function CelebrationConfetti() {
  const [visible, setVisible] = useState<boolean>(true);

  // Trigger celebratory haptic once on mount and cleanly unmount after single shot
  useEffect(() => {
    haptic('success');
    const timer = setTimeout(() => {
      setVisible(false);
    }, 2400);
    return () => clearTimeout(timer);
  }, []);

  // Generate single-shot dynamic burst particles
  const burstParticles = useMemo<Particle[]>(() => {
    const list: Particle[] = [];
    const count = 30;

    for (let i = 0; i < count; i++) {
      // Distribute radially around the medal
      const angle = (i / count) * 2 * Math.PI + (Math.random() * 0.4 - 0.2);
      // Bias upward and outward
      const distance = 50 + Math.random() * 80;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance - (Math.random() * 30 + 15);
      const rot = (Math.random() - 0.5) * 540;
      const typeRand = Math.random();
      const type: 'star' | 'ribbon' | 'circle' =
        typeRand < 0.45 ? 'star' : typeRand < 0.8 ? 'ribbon' : 'circle';
      const color = CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)];
      const size =
        type === 'star'
          ? 11 + Math.random() * 5
          : type === 'ribbon'
          ? 7 + Math.random() * 5
          : 4 + Math.random() * 4;
      const delay = Math.random() * 120;
      const duration = 1600 + Math.random() * 450;

      list.push({ id: i, type, color, size, tx, ty, rot, delay, duration });
    }
    return list;
  }, []);

  if (!visible) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-visible">
      {/* ── SINGLE-SHOT CRACKER BURST (XLOPUSHKA POP & FALL) ── */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {burstParticles.map((p) => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              // Pass custom CSS variables for physics translation
              // @ts-expect-error CSS variable
              '--tx': `${p.tx}px`,
              '--ty': `${p.ty}px`,
              '--rot': `${p.rot}deg`,
              animation: `confettiPopAndFall ${p.duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${p.delay}ms both`,
            }}
          >
            {p.type === 'star' && (
              <svg
                width={p.size}
                height={p.size}
                viewBox="0 0 24 24"
                fill={p.color}
                className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.12)]"
              >
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
            )}

            {p.type === 'ribbon' && (
              <div
                style={{
                  width: `${p.size}px`,
                  height: `${p.size * 0.55}px`,
                  backgroundColor: p.color,
                  borderRadius: '2px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
                }}
              />
            )}

            {p.type === 'circle' && (
              <div
                style={{
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  backgroundColor: p.color,
                  borderRadius: '50%',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
