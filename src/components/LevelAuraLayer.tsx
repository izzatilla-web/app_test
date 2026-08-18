import React, { useEffect, useRef, useState } from 'react';
import type { LevelMeta } from '../types/levelIdentity';
import { auraStrength, bandOf, levelAccent, levelGlow } from '../types/levelIdentity';

/**
 * Level Mood — the emotional stage of the level identity system.
 *
 * Every band owns a distinct scene, not just a hue:
 *
 *   A — cold, quiet light + a warm ember glowing up from the bottom edge
 *       with drifting sparks: "harakat qilish kerak".
 *   B — a paper plane gliding up across the header + rising light
 *       particles: momentum made visible.
 *   C — focused calm (the orbiting spark and target-lock live on the
 *       monogram).
 *   D — violet star glints + an occasional comet streak: brilliance.
 *   E — geometry (the band anyone can join): Euclidean figures draw
 *       themselves with a ghost compass, tiny shape outlines float up,
 *       and the gold halo breathes.
 *
 * All of it is pointer-events-none, transform/opacity-only, cross-fades on
 * level change, and is neutralized by prefers-reduced-motion.
 */

interface LevelAuraLayerProps {
  meta: LevelMeta;
  dark: boolean;
  /** Increment to fire the one-shot promotion light. */
  celebrate?: number;
}

/** Small positioned dot that rides one of the shared rise animations. */
function RisingDot({
  left,
  size,
  color,
  duration,
  delay
}: {
  left: string;
  size: number;
  color: string;
  duration: number;
  delay: number;
}) {
  return (
    <span
      className="level-particle absolute bottom-0 rounded-full"
      style={{
        left,
        width: size,
        height: size,
        backgroundColor: color,
        boxShadow: `0 0 ${size * 2}px ${color}`,
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`
      }}
    />
  );
}

function AuraField({ meta, dark }: { meta: LevelMeta; dark: boolean }) {
  const strength = auraStrength(meta);
  const band = bandOf(meta);
  const accent = levelAccent(meta, dark);
  const core = dark ? 0.16 + strength * 0.14 : 0.09 + strength * 0.09;
  const topHeight = 236 + strength * 72;

  return (
    <>
      {/* ── Top light ── */}
      <div
        className="absolute inset-x-0 top-0 overflow-hidden"
        style={{ height: topHeight }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(120% 78% at 50% -18%, ${levelGlow(meta, core)} 0%, ${levelGlow(meta, core * 0.35)} 42%, transparent 72%)`
          }}
        />

        {band.tier >= 2 && (
          <div
            className="absolute inset-x-0 top-0 h-2/3"
            style={{
              background: `radial-gradient(46% 60% at 50% -22%, ${levelGlow(meta, core * 0.8)} 0%, transparent 70%)`
            }}
          />
        )}

        {/* B — momentum: a paper plane glides up across the header,
            light particles rise behind it */}
        {meta.band === 'B' && (
          <>
            <div className="absolute inset-x-0 bottom-0 top-1/4">
              <RisingDot left="16%" size={3} color={levelGlow(meta, dark ? 0.7 : 0.5)} duration={6.4} delay={0} />
              <RisingDot left="41%" size={2} color={levelGlow(meta, dark ? 0.6 : 0.42)} duration={7.6} delay={2.1} />
              <RisingDot left="64%" size={3} color={levelGlow(meta, dark ? 0.7 : 0.5)} duration={6.9} delay={3.4} />
              <RisingDot left="86%" size={2} color={levelGlow(meta, dark ? 0.6 : 0.42)} duration={7.2} delay={1.2} />
            </div>
            <svg
              viewBox="0 0 24 24"
              width={23}
              height={23}
              className="level-plane absolute left-0 top-5"
              fill="none"
            >
              {/* upper wing / lower body at different alphas — the fold */}
              <path d="M2 12.5 L22 4 L10.8 13.2 Z" fill={levelGlow(meta, dark ? 0.9 : 0.7)} />
              <path d="M22 4 L13.6 20 L10.8 13.2 Z" fill={levelGlow(meta, dark ? 0.6 : 0.45)} />
            </svg>
          </>
        )}

        {/* D — brilliance: violet star glints + an occasional comet */}
        {meta.band === 'D' && (
          <>
            {[
              { left: '20%', top: 34, delay: 0 },
              { left: '72%', top: 64, delay: 1.5 },
              { left: '46%', top: 108, delay: 3 }
            ].map((glint) => (
              <span
                key={glint.left}
                className="level-glint absolute"
                style={{
                  left: glint.left,
                  top: glint.top,
                  width: 5,
                  height: 5,
                  backgroundColor: accent,
                  boxShadow: `0 0 8px ${levelGlow(meta, 0.8)}`,
                  animationDelay: `${glint.delay}s`
                }}
              />
            ))}
            <div
              className="aura-drift absolute -left-1/4 top-0 h-3/4 w-[150%]"
              style={{
                background: `linear-gradient(100deg, transparent 32%, ${levelGlow(meta, dark ? 0.09 : 0.05)} 50%, transparent 68%)`
              }}
            />
            <div className="level-comet absolute left-0 top-[58px] -rotate-[14deg]">
              <span
                className="block h-[2px] w-[64px] rounded-full"
                style={{
                  background: `linear-gradient(90deg, transparent, ${levelGlow(meta, dark ? 0.85 : 0.6)})`
                }}
              />
              <span
                className="absolute right-[-2px] top-[-1.5px] h-[5px] w-[5px] rounded-full"
                style={{
                  backgroundColor: accent,
                  boxShadow: `0 0 8px ${levelGlow(meta, 0.9)}`
                }}
              />
            </div>
          </>
        )}

        {/* E — geometry: a ghost compass draws a circle, inscribes an
            equilateral triangle and drops its median; tiny shape outlines
            float up; the gold halo breathes. */}
        {meta.band === 'E' && (
          <>
            <svg
              viewBox="0 0 120 120"
              width={124}
              height={124}
              className="absolute left-1/2 top-[8px] -translate-x-1/2"
              fill="none"
              style={{ opacity: dark ? 0.6 : 0.45 }}
            >
              <circle
                cx="60"
                cy="62"
                r="44"
                className="level-draw"
                pathLength={100}
                stroke={levelGlow(meta, 0.8)}
                strokeWidth="1.2"
              />
              <polygon
                points="60,18 98.1,84 21.9,84"
                className="level-draw"
                pathLength={100}
                stroke={levelGlow(meta, 0.65)}
                strokeWidth="1.1"
                strokeLinejoin="round"
                style={{ animationDelay: '1.6s' }}
              />
              <line
                x1="60"
                y1="18"
                x2="60"
                y2="84"
                className="level-draw"
                pathLength={100}
                stroke={levelGlow(meta, 0.5)}
                strokeWidth="1"
                strokeDasharray="100"
                style={{ animationDelay: '3.1s' }}
              />
            </svg>

            <div
              className="halo-breathe absolute left-1/2 top-[-90px] h-[240px] w-[340px] -translate-x-1/2 rounded-full"
              style={
                {
                  '--halo-a': dark ? 0.5 : 0.4,
                  background: `radial-gradient(50% 50% at 50% 50%, ${levelGlow(meta, dark ? 0.22 : 0.14)} 0%, transparent 70%)`
                } as React.CSSProperties
              }
            />

            {/* floating micro-geometry: triangle, square, hexagon */}
            <div className="absolute inset-x-0 bottom-0 top-1/3">
              {[
                { left: '18%', shape: 'M6 1.5 L10.8 10 L1.2 10 Z', duration: 11, delay: 0 },
                { left: '52%', shape: 'M2.2 2.2 H9.8 V9.8 H2.2 Z', duration: 13.5, delay: 4.2 },
                { left: '80%', shape: 'M6 1 L10.3 3.5 V8.5 L6 11 L1.7 8.5 V3.5 Z', duration: 12, delay: 7.5 }
              ].map((item) => (
                <svg
                  key={item.left}
                  viewBox="0 0 12 12"
                  width={11}
                  height={11}
                  className="level-shape absolute bottom-0"
                  fill="none"
                  style={{
                    left: item.left,
                    animationDuration: `${item.duration}s`,
                    animationDelay: `${item.delay}s`
                  }}
                >
                  <path d={item.shape} stroke={levelGlow(meta, dark ? 0.7 : 0.5)} strokeWidth="1" strokeLinejoin="round" />
                </svg>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── A — the ember: warm urgency rising from the bottom edge.
             Sits ABOVE the scroll content (z-20, below the z-30 tab bar)
             as an ambient light leak — pointer-events-none, so it can
             never block a tap, and soft enough to never hurt reading. ── */}
      {meta.band === 'A' && (
        <div className="absolute inset-x-0 bottom-0 z-20 h-[210px] overflow-hidden">
          <div
            className="level-ember absolute inset-0"
            style={{
              background: [
                `radial-gradient(95% 130% at 50% 118%, hsl(10 86% 52% / ${dark ? 0.5 : 0.26}) 0%, hsl(26 92% 55% / ${dark ? 0.22 : 0.12}) 46%, transparent 76%)`,
                `radial-gradient(45% 70% at 22% 112%, hsl(4 82% 50% / ${dark ? 0.3 : 0.14}) 0%, transparent 70%)`
              ].join(', ')
            }}
          />
          <RisingDot left="30%" size={2} color={`hsl(18 92% 58% / ${dark ? 0.8 : 0.55})`} duration={5.8} delay={0.6} />
          <RisingDot left="58%" size={2} color={`hsl(10 88% 55% / ${dark ? 0.7 : 0.48})`} duration={6.8} delay={2.8} />
          <RisingDot left="80%" size={2} color={`hsl(26 92% 58% / ${dark ? 0.7 : 0.48})`} duration={6.2} delay={4.4} />
        </div>
      )}
    </>
  );
}

export function LevelAuraLayer({ meta, dark, celebrate = 0 }: LevelAuraLayerProps) {
  const [leaving, setLeaving] = useState<LevelMeta | null>(null);
  const [flash, setFlash] = useState(0);
  const shown = useRef(meta);
  const seenCelebrate = useRef(celebrate);

  useEffect(() => {
    if (shown.current.code === meta.code) return;
    setLeaving(shown.current);
    shown.current = meta;
    const timer = window.setTimeout(() => setLeaving(null), 760);
    return () => window.clearTimeout(timer);
  }, [meta]);

  useEffect(() => {
    if (celebrate === seenCelebrate.current) return;
    seenCelebrate.current = celebrate;
    setFlash(celebrate);
    const timer = window.setTimeout(() => setFlash(0), 1300);
    return () => window.clearTimeout(timer);
  }, [celebrate]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div key={meta.code} className="aura-in absolute inset-0">
        <AuraField meta={meta} dark={dark} />
      </div>

      {leaving && (
        <div key={`out-${leaving.code}`} className="aura-out absolute inset-0">
          <AuraField meta={leaving} dark={dark} />
        </div>
      )}

      {flash > 0 && (
        <div
          key={`flash-${flash}`}
          className="absolute inset-x-0 top-0 h-[280px] overflow-hidden"
        >
          <div
            className="level-sweep absolute inset-y-0 w-1/3"
            style={{
              background: `linear-gradient(90deg, transparent, ${levelGlow(meta, dark ? 0.22 : 0.15)}, transparent)`
            }}
          />
          <div
            className="level-bloom absolute left-1/2 top-[-60px] h-[230px] w-[340px] -translate-x-1/2 rounded-full"
            style={{
              background: `radial-gradient(50% 50% at 50% 50%, ${levelGlow(meta, dark ? 0.3 : 0.2)} 0%, transparent 70%)`
            }}
          />
        </div>
      )}
    </div>
  );
}
