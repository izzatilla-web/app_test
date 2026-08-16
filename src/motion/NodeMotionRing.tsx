import {
  createNodeMotionPath,
  motionPathExtent,
  resolveNodeGeometry } from
'./nodeMotionPath';
import type { NodeMotionGeometry } from './nodeMotionPath';
import { usePrefersReducedMotion } from './useReducedMotion';

/** stroke + glow clearance so linecaps never clip at the svg edge */
const EDGE = 6;

interface NodeMotionRingProps {
  geometry: NodeMotionGeometry | undefined;
  /** rendered node box size in px — the path scales from this */
  size: number;
  /** visual gap between the node edge and the traveling light */
  gap?: number;
}

/**
 * Light pulse traveling around the current node. Follows the node's real
 * outline (diamond, squircle, circle, …) instead of assuming a circle:
 * the perimeter comes from the shape metadata via createNodeMotionPath and
 * the comet is a stroke-dash arc animated along that exact path in CSS.
 * Sits inside the node button, so press/scale transforms keep it attached.
 */
export function NodeMotionRing({ geometry, size, gap = 7 }: NodeMotionRingProps) {
  const reduced = usePrefersReducedMotion();
  const resolved = resolveNodeGeometry(geometry, { width: size, height: size });
  const pad = Math.ceil(motionPathExtent(resolved, gap) - size / 2) + EDGE;
  const box = size + pad * 2;
  const d = createNodeMotionPath(resolved, gap, box / 2, box / 2);
  return (
    <svg
      className="pointer-events-none absolute left-1/2"
      width={box}
      height={box}
      viewBox={`0 0 ${box} ${box}`}
      style={{ top: -pad, marginLeft: -box / 2 }}
      aria-hidden="true">

      <path d={d} pathLength={100} className="orbit-track" />
      {!reduced &&
      <>
          <path d={d} pathLength={100} className="orbit-comet-tail" />
          <path d={d} pathLength={100} className="orbit-comet" />
        </>
      }
    </svg>);

}
