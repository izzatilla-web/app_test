import React from 'react';
import { NailHead } from './NailHead';

/**
 * Loose panel — the "barely nailed to the wall" treatment for low levels.
 *
 * Wraps any block and makes it hang from a single visible nail. The motion
 * is slip-and-catch gravity (see the looseSway keyframes): long stillness at
 * the resting tilt, a sudden slip toward the un-nailed side, two damped
 * bounces as the nail catches, a low hang, then a slow creep back. Purely
 * decorative — layout, hit-areas and scrolling are untouched, and with
 * `active={false}` the children render exactly as before.
 *
 * Tilt physics: the nailed corner holds, the free side droops. So a nail in
 * the top-RIGHT corner pairs with a negative (counterclockwise) tilt, and a
 * top-LEFT nail with a positive one.
 */
interface LoosePanelProps {
  active: boolean;
  /** Resting tilt in degrees (sign must match the nail corner, see above). */
  tilt: number;
  nail: 'tl' | 'tr';
  /** Seconds; stagger several panels so they never slip in unison. */
  delay?: number;
  /** Full slip cycle in seconds. */
  period?: number;
  children: React.ReactNode;
}

/** How much further the panel falls when it slips (× resting tilt). */
const DROP_FACTOR = 2.6;

export function LoosePanel({
  active,
  tilt,
  nail,
  delay = 0,
  period = 9,
  children
}: LoosePanelProps) {
  if (!active) return <>{children}</>;

  const origin = nail === 'tr' ? 'calc(100% - 17px) 10px' : '17px 10px';

  return (
    <div
      className="level-loose relative"
      style={
        {
          transformOrigin: origin,
          '--loose-rest': `${tilt}deg`,
          '--loose-drop': `${tilt * DROP_FACTOR}deg`,
          '--loose-t': `${period}s`,
          animationDelay: `${delay}s`
        } as React.CSSProperties
      }
    >
      <NailHead
        size={28}
        className={[
          'absolute top-2 z-20 pointer-events-none',
          nail === 'tr' ? 'right-3.5' : 'left-3.5'
        ].join(' ')}
      />
      {children}
    </div>
  );
}
