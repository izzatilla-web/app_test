import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CELEBRATION_COLORS, fireConfettiBurst } from './confettiEngine';
import { usePrefersReducedMotion } from '../motion/useReducedMotion';
import { sound } from '../sound';
import { haptic } from '../tokens';

/* timeline (ms) — keep in sync with the popper keyframe delays in index.css */
const SETTLE = 240; // small pause while the map settles back in
const FIRE = 540; // popper has popped in + recoiled → bang
const DONE = 2050;
const REDUCED_DONE = 900;

interface CelebrationOverlayProps {
  /** viewport-space centre of the just-unlocked node */
  x: number;
  y: number;
  /** rendered node size — the popper keeps its distance relative to it */
  nodeSize: number;
  onDone: () => void;
}

/**
 * Party-popper + confetti burst saluting a just-unlocked journey node.
 *
 * Rendered through a body portal so scroll containers and the pull-to-refresh
 * translate wrapper can never clip or re-anchor it. Purely decorative:
 * pointer events pass through, nothing shifts layout, and every timer,
 * particle and canvas is torn down when the timeline ends or the component
 * unmounts mid-flight (navigation, tab switch, a newer celebration).
 */
export function CelebrationOverlay({ x, y, nodeSize, onDone }: CelebrationOverlayProps) {
  const reduced = usePrefersReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fired, setFired] = useState(false);

  /* popper sits diagonally below-left of the node, aiming up-right at it */
  const mouthOffset = Math.max(22, nodeSize * 0.38);
  const mouthX = x - mouthOffset;
  const mouthY = y + mouthOffset;

  useEffect(() => {
    let stopBurst: (() => void) | null = null;
    const timers: number[] = [];
    if (reduced) {
      // Minimal, motion-free feedback: brief glow + the pop sound (mute still wins).
      timers.push(
        window.setTimeout(() => {
          haptic('success');
          sound.pop();
        }, SETTLE)
      );
      timers.push(window.setTimeout(onDone, REDUCED_DONE));
    } else {
      timers.push(
        window.setTimeout(() => {
          setFired(true);
          haptic('success');
          sound.pop();
          const canvas = canvasRef.current;
          if (canvas) {
            stopBurst = fireConfettiBurst(canvas, {
              originX: mouthX,
              originY: mouthY,
              angleDeg: -60,
              spreadDeg: 76,
              count: 26,
              colors: CELEBRATION_COLORS
            });
          }
        }, FIRE)
      );
      timers.push(window.setTimeout(onDone, DONE));
    }
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      stopBurst?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[60]" aria-hidden="true">
      {reduced ?
      <span
        className="absolute h-[90px] w-[90px] rounded-full"
        style={{
          left: x - 45,
          top: y - 45,
          background: 'radial-gradient(circle, hsl(221 83% 53% / 0.3), transparent 70%)'
        }} /> :

      <>
          <span
          className="popper-body absolute"
          style={{ left: mouthX - 49, top: mouthY - 25 }}>

            <span className="popper-cone block">
              <PopperArt />
            </span>
          </span>
          {fired &&
        <span
          className="pop-flash absolute h-[26px] w-[26px] rounded-full"
          style={{ left: mouthX - 13, top: mouthY - 13 }} />
        }
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        </>
      }
    </div>,
    document.body
  );
}

/** Small flat-design party popper: gold cone, app-blue stripes, paper mouth. */
function PopperArt() {
  return (
    <svg width="44" height="56" viewBox="0 0 44 56" fill="none" aria-hidden="true">
      <path
        d="M 15 50 L 7 14 L 37 14 L 29 50 Z"
        fill="#f5b60b"
        stroke="#d97706"
        strokeWidth="1.5"
        strokeLinejoin="round" />

      <path d="M 8.78 22 L 35.22 22 L 33.89 28 L 10.11 28 Z" fill="#818cf8" />
      <path d="M 11.89 36 L 32.11 36 L 31 41 L 13 41 Z" fill="#38bdf8" />
      <ellipse cx="22" cy="14" rx="15" ry="4.5" fill="#fde68a" stroke="#d97706" strokeWidth="1.5" />
    </svg>);

}
