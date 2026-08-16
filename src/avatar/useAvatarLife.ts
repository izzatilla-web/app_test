/**
 * Idle animation engine — makes the avatar feel alive without ever
 * becoming distracting. Randomized blinks, subtle gaze shifts, occasional
 * head tilts and rare "personality moments", plus short reactions when the
 * user touches a control in the studio.
 *
 * All output is a small pose object; the SVG rig turns it into
 * transform/opacity changes only (GPU-friendly). Timers are pooled and
 * fully cleared on unmount. Honors prefers-reduced-motion.
 */

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { AvatarPose, AvatarReaction } from './avatarTypes';
import { NEUTRAL_POSE } from './avatarTypes';

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeReduced(fn: () => void): () => void {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener('change', fn);
  return () => mq.removeEventListener('change', fn);
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCED_QUERY).matches);
}

function between(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function useAvatarLife(active: boolean): {
  pose: AvatarPose;
  react: (kind: AvatarReaction) => void;
} {
  const reduced = usePrefersReducedMotion();
  const alive = active && !reduced;
  const [pose, setPose] = useState<AvatarPose>(NEUTRAL_POSE);
  const timers = useRef<Set<number>>(new Set());
  const aliveRef = useRef(alive);
  aliveRef.current = alive;

  const patch = useCallback((p: Partial<AvatarPose>) => {
    setPose((prev) => ({ ...prev, ...p }));
  }, []);

  /** Pooled timeout — everything dies together on unmount. */
  const after = useCallback((ms: number, fn: () => void) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, ms);
    timers.current.add(id);
    return id;
  }, []);

  const blinkOnce = useCallback(
    (hold = 110) => {
      patch({ blink: 1 });
      after(hold, () => patch({ blink: 0 }));
    },
    [after, patch]
  );

  // ── Idle loops ─────────────────────────────────────────
  useEffect(() => {
    if (!alive) {
      setPose(NEUTRAL_POSE);
      return;
    }
    const pool = timers.current;

    const blinkLoop = () => {
      after(between(2800, 7000), () => {
        if (!aliveRef.current) return;
        const roll = Math.random();
        if (roll < 0.14) {
          // double blink
          blinkOnce();
          after(300, blinkOnce);
        } else if (roll < 0.24) {
          blinkOnce(210); // slightly longer, lazy blink
        } else {
          blinkOnce();
        }
        blinkLoop();
      });
    };

    const gazeLoop = () => {
      after(between(2400, 5200), () => {
        if (!aliveRef.current) return;
        const targets: [number, number][] = [
          [-1, 0],
          [1, 0],
          [-0.7, -0.6],
          [0.7, -0.6],
          [0, 0.5]];

        const [x, y] = targets[Math.floor(Math.random() * targets.length)];
        patch({ pupilX: x, pupilY: y });
        after(between(700, 1500), () => patch({ pupilX: 0, pupilY: 0 }));
        gazeLoop();
      });
    };

    const tiltLoop = () => {
      after(between(9000, 16000), () => {
        if (!aliveRef.current) return;
        patch({ tilt: Math.random() < 0.5 ? -1.4 : 1.4 });
        after(between(1000, 1600), () => patch({ tilt: 0 }));
        tiltLoop();
      });
    };

    const personalityLoop = () => {
      after(between(20000, 45000), () => {
        if (!aliveRef.current) return;
        const moment = Math.floor(Math.random() * 6);
        if (moment === 0) {
          patch({ mood: 'smile' });
          after(1500, () => patch({ mood: 'idle' }));
        } else if (moment === 1) {
          blinkOnce();
          after(300, blinkOnce);
        } else if (moment === 2) {
          const dir = Math.random() < 0.5 ? -1 : 1;
          patch({ pupilX: dir, tilt: dir * 1.2 });
          after(1200, () => patch({ pupilX: 0, tilt: 0 }));
        } else if (moment === 3) {
          patch({ browLift: 1 });
          after(800, () => patch({ browLift: 0 }));
        } else if (moment === 4) {
          patch({ lift: true, mood: 'smile' });
          after(450, () => patch({ lift: false }));
          after(1400, () => patch({ mood: 'idle' }));
        } else {
          blinkOnce(240);
        }
        personalityLoop();
      });
    };

    blinkLoop();
    gazeLoop();
    tiltLoop();
    personalityLoop();

    return () => {
      pool.forEach((id) => window.clearTimeout(id));
      pool.clear();
    };
  }, [alive, after, blinkOnce, patch]);

  // ── Reactions ──────────────────────────────────────────
  const react = useCallback(
    (kind: AvatarReaction) => {
      if (!aliveRef.current) return;
      switch (kind) {
        case 'skin':
          patch({ mood: 'smile' });
          after(1100, () => patch({ mood: 'idle' }));
          break;
        case 'face':
          patch({ tilt: 2 });
          after(240, () => patch({ tilt: -1.4 }));
          after(500, () => patch({ tilt: 0 }));
          break;
        case 'eyes':
          // glance down toward the option panel
          patch({ pupilX: 0.4, pupilY: 1 });
          after(900, () => patch({ pupilX: 0, pupilY: 0 }));
          break;
        case 'brows':
          patch({ browLift: 1 });
          after(700, () => patch({ browLift: 0 }));
          break;
        case 'mouth':
          patch({ mood: 'smile' });
          after(1400, () => patch({ mood: 'idle' }));
          break;
        case 'hair':
          patch({ tilt: -2.6 });
          after(180, () => patch({ tilt: 2.2 }));
          after(380, () => patch({ tilt: -1 }));
          after(560, () => patch({ tilt: 0 }));
          break;
        case 'headwear':
          // peek upward at the new hat
          patch({ pupilY: -1, browLift: 1 });
          after(850, () => patch({ pupilY: 0, browLift: 0 }));
          break;
        case 'hijab':
          // a gentle, pleased nod
          patch({ mood: 'smile', tilt: 1.6 });
          after(500, () => patch({ tilt: 0 }));
          after(1300, () => patch({ mood: 'idle' }));
          break;
        case 'clothing':
          patch({ lift: true, mood: 'smile' });
          after(420, () => patch({ lift: false }));
          after(1000, () => patch({ mood: 'idle' }));
          break;
        case 'accessories':
          blinkOnce();
          after(280, blinkOnce);
          break;
        case 'background':
          patch({ pupilX: -1 });
          after(420, () => patch({ pupilX: 1 }));
          after(840, () => patch({ pupilX: 0 }));
          break;
        case 'celebrate':
          patch({ mood: 'smile', lift: true });
          after(420, () => patch({ lift: false }));
          after(600, () => blinkOnce());
          after(1900, () => patch({ mood: 'idle' }));
          break;
      }
    },
    [after, blinkOnce, patch]
  );

  return useMemo(() => ({ pose, react }), [pose, react]);
}
