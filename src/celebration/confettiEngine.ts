/**
 * Canvas confetti burst for celebration moments.
 *
 * One canvas, one short-lived rAF loop, physics-based particles
 * (launch velocity, gravity, air resistance, tumbling) that clean up
 * automatically once every piece has died. Lives outside React so
 * components never re-render per frame.
 */

export interface ConfettiBurstOptions {
  /** burst origin in viewport px */
  originX: number;
  originY: number;
  /** launch direction in degrees, -90 = straight up */
  angleDeg?: number;
  spreadDeg?: number;
  count?: number;
  /** initial velocity scale in px/s */
  power?: number;
  colors?: string[];
  onDone?: () => void;
}

type ParticleKind = 'rect' | 'circle' | 'ribbon' | 'star';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  /** paper-flip phase — scaleY(sin) gives the tumbling-card look */
  flip: number;
  vflip: number;
  w: number;
  h: number;
  color: string;
  kind: ParticleKind;
  drag: number;
  wobble: number;
  /** seconds before the piece leaves the popper */
  delay: number;
  ttl: number;
  age: number;
}

/** app-consistent palette: primary blues, good green, gold, accent violet */
export const CELEBRATION_COLORS = [
'#3b82f6', '#60a5fa', '#38bdf8', '#818cf8',
'#22c55e', '#f5b60b', '#fbbf24', '#f472b6'];


const GRAVITY = 1150; // px/s²
const KIND_MIX: ParticleKind[] = [
'rect', 'rect', 'circle', 'ribbon', 'rect', 'star', 'circle', 'rect', 'ribbon', 'rect'];


function drawStar(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? s : s * 0.42;
    const a = Math.PI / 4 * i;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);else
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

/**
 * Fire a single burst on the given full-viewport canvas.
 * Returns a cancel function that stops the loop and clears the canvas.
 */
export function fireConfettiBurst(
canvas: HTMLCanvasElement,
options: ConfettiBurstOptions)
: () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    options.onDone?.();
    return () => undefined;
  }
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  canvas.width = Math.round(vw * dpr);
  canvas.height = Math.round(vh * dpr);
  ctx.scale(dpr, dpr);

  const {
    angleDeg = -60,
    spreadDeg = 76,
    count = 26,
    power = 640,
    colors = CELEBRATION_COLORS
  } = options;
  const rand = (a: number, b: number): number => a + Math.random() * (b - a);

  const particles: Particle[] = Array.from({ length: count }, (_, i) => {
    const kind = KIND_MIX[i % KIND_MIX.length];
    const angle = (angleDeg + rand(-spreadDeg / 2, spreadDeg / 2)) * Math.PI / 180;
    const speed = power * rand(0.45, 1.15) * (kind === 'ribbon' ? 0.85 : 1);
    return {
      x: options.originX,
      y: options.originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      rot: rand(0, Math.PI * 2),
      vr: rand(-9, 9),
      flip: rand(0, Math.PI * 2),
      vflip: rand(5, 12),
      w: kind === 'ribbon' ? rand(3.5, 5) : rand(5, 9),
      h: kind === 'ribbon' ? rand(11, 17) : rand(5, 9),
      color: colors[i % colors.length],
      kind,
      drag: kind === 'ribbon' ? 2.6 : rand(1.4, 2.1),
      wobble: rand(1.5, 4),
      delay: rand(0, 0.07),
      ttl: rand(0.9, 1.5),
      age: 0
    };
  });

  let raf = 0;
  let last = 0;
  let cancelled = false;

  const step = (now: number): void => {
    if (cancelled) return;
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    ctx.clearRect(0, 0, vw, vh);
    let alive = 0;

    for (const p of particles) {
      if (p.delay > 0) {
        p.delay -= dt;
        alive++;
        continue;
      }
      p.age += dt;
      if (p.age >= p.ttl) continue;
      alive++;

      // gravity + air resistance, then integrate
      p.vx -= p.vx * p.drag * dt;
      p.vy += (GRAVITY - p.vy * p.drag) * dt;
      p.x += p.vx * dt + Math.sin(p.age * p.wobble * 4) * (p.kind === 'ribbon' ? 0.9 : 0.3);
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      p.flip += p.vflip * dt;

      const lifeLeft = 1 - p.age / p.ttl;
      ctx.globalAlpha = Math.min(1, lifeLeft / 0.3);
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(p.x, p.y);
      if (p.kind === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'star') {
        ctx.rotate(p.rot);
        drawStar(ctx, p.w * 0.75);
      } else {
        const squish = Math.sin(p.flip);
        ctx.rotate(p.rot);
        ctx.scale(1, Math.max(Math.abs(squish), 0.18) * Math.sign(squish || 1));
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    if (alive > 0) {
      raf = requestAnimationFrame(step);
    } else {
      ctx.clearRect(0, 0, vw, vh);
      options.onDone?.();
    }
  };

  raf = requestAnimationFrame((now) => {
    last = now;
    step(now);
  });

  return () => {
    cancelled = true;
    cancelAnimationFrame(raf);
    ctx.clearRect(0, 0, vw, vh);
  };
}
