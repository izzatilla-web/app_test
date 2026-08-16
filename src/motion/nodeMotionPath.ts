/**
 * Shape-aware node motion geometry.
 *
 * Journey nodes declare their visual geometry explicitly (see `geometry` on
 * GameLevel in gameData). This module resolves that metadata into a concrete
 * outline and builds an SVG path running at a fixed distance outside the
 * node's real perimeter — circle, square, rounded square, diamond, hexagon
 * or a custom polygon. The animation layer (NodeMotionRing) simply follows
 * the generated path, so adding a shape never touches the animation itself.
 *
 * Resolution ladder (most to least trusted):
 *   1. explicit `shape` metadata from the node configuration
 *   2. explicit custom `motionPath` points
 *   3. measured DOM basics (box, border-radius, rotation) when supplied
 *   4. bounding-box fallback that still hugs the node
 */

export type NodeShape =
'circle' |
'square' |
'rounded-square' |
'diamond' |
'hexagon' |
'custom';

export interface NodeMotionGeometry {
  shape: NodeShape;
  /** corner radius as a fraction of the node size (0..0.5), square family */
  cornerRadius?: number;
  /** visual rotation of the node box in degrees (diamond defaults to 45) */
  rotationDeg?: number;
  /** unit-space perimeter points (0..1 box, clockwise) for `custom` shapes */
  motionPath?: [number, number][];
}

/** Optional DOM-measured facts for nodes that carry no explicit metadata. */
export interface MeasuredNodeBox {
  width: number;
  height: number;
  borderRadiusPx?: number;
  rotationDeg?: number;
}

export interface ResolvedNodeGeometry {
  shape: NodeShape;
  width: number;
  height: number;
  cornerRadiusPx: number;
  rotationDeg: number;
  motionPath: [number, number][] | null;
}

type Pt = [number, number];

/** default corner fraction when a square-family node omits it */
const DEFAULT_CORNER: Partial<Record<NodeShape, number>> = {
  'rounded-square': 0.25,
  diamond: 0.2
};

const fmt = (n: number): string => String(Math.round(n * 100) / 100);

function rotatePoint([x, y]: Pt, deg: number): Pt {
  if (deg === 0) return [x, y];
  const a = deg * Math.PI / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  return [x * cos - y * sin, x * sin + y * cos];
}

export function resolveNodeGeometry(
geometry: NodeMotionGeometry | undefined,
box: MeasuredNodeBox)
: ResolvedNodeGeometry {
  const width = Math.max(box.width, 1);
  const height = Math.max(box.height, 1);
  const min = Math.min(width, height);

  if (geometry?.shape === 'custom' && geometry.motionPath && geometry.motionPath.length >= 3) {
    return {
      shape: 'custom',
      width,
      height,
      cornerRadiusPx: 0,
      rotationDeg: geometry.rotationDeg ?? 0,
      motionPath: geometry.motionPath
    };
  }
  if (geometry && geometry.shape !== 'custom') {
    return {
      shape: geometry.shape,
      width,
      height,
      cornerRadiusPx: (geometry.cornerRadius ?? DEFAULT_CORNER[geometry.shape] ?? 0) * min,
      rotationDeg: geometry.rotationDeg ?? (geometry.shape === 'diamond' ? 45 : 0),
      motionPath: null
    };
  }

  // No usable metadata: infer a rounded box from whatever the DOM reports.
  const measuredR = Math.max(box.borderRadiusPx ?? 0, 0);
  if (measuredR >= min / 2 && Math.abs(width - height) < 1) {
    return { shape: 'circle', width, height, cornerRadiusPx: min / 2, rotationDeg: 0, motionPath: null };
  }
  return {
    shape: 'rounded-square',
    width,
    height,
    cornerRadiusPx: Math.min(measuredR, min / 2),
    rotationDeg: box.rotationDeg ?? 0,
    motionPath: null
  };
}

/** Visual CSS the node itself should use, so styling and motion share one source. */
export function nodeVisualStyle(geometry: NodeMotionGeometry | undefined): {
  borderRadius: string;
  rotationDeg: number;
} {
  const shape = geometry?.shape ?? 'circle';
  const rotationDeg = geometry?.rotationDeg ?? (shape === 'diamond' ? 45 : 0);
  if (shape === 'circle') return { borderRadius: '9999px', rotationDeg };
  const frac = geometry?.cornerRadius ?? DEFAULT_CORNER[shape] ?? 0;
  return { borderRadius: `${fmt(frac * 100)}%`, rotationDeg };
}

/* ── path generators ───────────────────────────────────── */

export function createCirclePath(rx: number, ry: number, cx: number, cy: number): string {
  return [
  `M ${fmt(cx)} ${fmt(cy - ry)}`,
  `A ${fmt(rx)} ${fmt(ry)} 0 1 1 ${fmt(cx)} ${fmt(cy + ry)}`,
  `A ${fmt(rx)} ${fmt(ry)} 0 1 1 ${fmt(cx)} ${fmt(cy - ry)}`,
  'Z'].
  join(' ');
}

/**
 * Rounded rectangle (square when halfW === halfH, plain when radius = 0),
 * rotated around its centre. Circular corner arcs are rotation-invariant,
 * so rotating the endpoints is exact.
 */
export function createRoundedSquarePath(
halfW: number,
halfH: number,
radius: number,
rotationDeg: number,
cx: number,
cy: number)
: string {
  const r = Math.min(Math.max(radius, 0), Math.min(halfW, halfH));
  if (r >= Math.min(halfW, halfH) - 0.01 && Math.abs(halfW - halfH) < 0.01) {
    return createCirclePath(halfW, halfH, cx, cy);
  }
  const p = (x: number, y: number): string => {
    const [rx, ry] = rotatePoint([x, y], rotationDeg);
    return `${fmt(cx + rx)} ${fmt(cy + ry)}`;
  };
  const arc = `A ${fmt(r)} ${fmt(r)} 0 0 1`;
  return [
  `M ${p(-halfW + r, -halfH)}`,
  `L ${p(halfW - r, -halfH)}`,
  `${arc} ${p(halfW, -halfH + r)}`,
  `L ${p(halfW, halfH - r)}`,
  `${arc} ${p(halfW - r, halfH)}`,
  `L ${p(-halfW + r, halfH)}`,
  `${arc} ${p(-halfW, halfH - r)}`,
  `L ${p(-halfW, -halfH + r)}`,
  `${arc} ${p(-halfW + r, -halfH)}`,
  'Z'].
  join(' ');
}

/** A diamond is the square family rotated — the rotation comes from geometry. */
export function createDiamondPath(
half: number,
radius: number,
rotationDeg: number,
cx: number,
cy: number)
: string {
  return createRoundedSquarePath(half, half, radius, rotationDeg, cx, cy);
}

function towards(from: Pt, to: Pt, dist: number): Pt {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy) || 1;
  const t = Math.min(dist / len, 0.5);
  return [from[0] + dx * t, from[1] + dy * t];
}

/** Closed polygon with softly rounded vertices (quadratic bridges). */
function roundedPolygonPath(points: Pt[], rounding: number, cx: number, cy: number): string {
  const n = points.length;
  const cmds: string[] = [];
  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];
    const inPt = towards(curr, prev, rounding);
    const outPt = towards(curr, next, rounding);
    cmds.push(`${i === 0 ? 'M' : 'L'} ${fmt(cx + inPt[0])} ${fmt(cy + inPt[1])}`);
    cmds.push(`Q ${fmt(cx + curr[0])} ${fmt(cy + curr[1])} ${fmt(cx + outPt[0])} ${fmt(cy + outPt[1])}`);
  }
  cmds.push('Z');
  return cmds.join(' ');
}

/** Regular pointy-top hexagon, optionally rotated and corner-rounded. */
export function createHexagonPath(
circumradius: number,
rounding: number,
rotationDeg: number,
cx: number,
cy: number)
: string {
  const points: Pt[] = Array.from({ length: 6 }, (_, i) => {
    const a = Math.PI / 3 * i - Math.PI / 2;
    return rotatePoint([circumradius * Math.cos(a), circumradius * Math.sin(a)], rotationDeg);
  });
  return roundedPolygonPath(points, rounding, cx, cy);
}

/** Custom perimeter from unit-space points, scaled to the offset node box. */
export function createCustomPath(
unitPoints: Pt[],
width: number,
height: number,
offset: number,
rotationDeg: number,
cx: number,
cy: number)
: string {
  const points = unitPoints.map(([ux, uy]) =>
  rotatePoint([(ux - 0.5) * (width + offset * 2), (uy - 0.5) * (height + offset * 2)], rotationDeg)
  );
  return roundedPolygonPath(points, 2, cx, cy);
}

/**
 * Perimeter path at `offset` px outside the resolved node outline, centred
 * at (cx, cy). Offsetting a circle or rounded rectangle by o is exact:
 * the same shape with radius grown by o.
 */
export function createNodeMotionPath(
g: ResolvedNodeGeometry,
offset: number,
cx: number,
cy: number)
: string {
  const halfW = g.width / 2 + offset;
  const halfH = g.height / 2 + offset;
  switch (g.shape) {
    case 'circle':
      return createCirclePath(halfW, halfH, cx, cy);
    case 'square':
    case 'rounded-square':
      return createRoundedSquarePath(halfW, halfH, g.cornerRadiusPx + offset, g.rotationDeg, cx, cy);
    case 'diamond':
      return createDiamondPath(Math.min(halfW, halfH), g.cornerRadiusPx + offset, g.rotationDeg, cx, cy);
    case 'hexagon':{
        // moving each edge out by `offset` grows the circumradius by offset / cos(30°)
        const rc = Math.min(g.width, g.height) / 2 + offset / Math.cos(Math.PI / 6);
        return createHexagonPath(rc, Math.max(g.cornerRadiusPx, 2) + offset * 0.3, g.rotationDeg, cx, cy);
      }
    case 'custom':
      if (g.motionPath) {
        return createCustomPath(g.motionPath, g.width, g.height, offset, g.rotationDeg, cx, cy);
      }
      // graceful bounding-box fallback
      return createRoundedSquarePath(halfW, halfH, offset + 4, g.rotationDeg, cx, cy);
  }
}

/**
 * Farthest distance the motion path reaches from the node centre — used to
 * size the SVG canvas so rotated shapes (diamond corners) never clip.
 */
export function motionPathExtent(g: ResolvedNodeGeometry, offset: number): number {
  const halfW = g.width / 2 + offset;
  const halfH = g.height / 2 + offset;
  switch (g.shape) {
    case 'circle':
      return Math.max(halfW, halfH);
    case 'hexagon':
      return Math.min(g.width, g.height) / 2 + offset / Math.cos(Math.PI / 6);
    case 'custom':
      if (g.motionPath) {
        const scale = Math.max(g.width, g.height) + offset * 2;
        return g.motionPath.reduce(
          (m, [ux, uy]) => Math.max(m, Math.hypot((ux - 0.5) * scale, (uy - 0.5) * scale)),
          0
        );
      }
      return Math.hypot(halfW, halfH);
    default:{
        // corner of a (possibly rotated) rounded rectangle
        const r = Math.min(g.cornerRadiusPx + offset, Math.min(halfW, halfH));
        return Math.hypot(halfW - r, halfH - r) + r;
      }
  }
}
