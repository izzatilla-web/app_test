/**
 * AvatarLive — AvatarRig + idle engine in one component.
 * Drop-in anywhere the character should breathe, blink and react.
 * Pass `reaction` with a bumped counter to trigger a one-shot reaction.
 */

import { useEffect } from 'react';
import { AvatarRig } from './AvatarRig';
import { useAvatarLife, usePrefersReducedMotion } from './useAvatarLife';
import type { AvatarConfig, AvatarReaction } from './avatarTypes';

export interface ReactionSignal {
  kind: AvatarReaction;
  n: number;
}

export interface AvatarLiveProps {
  config: AvatarConfig;
  crop?: 'bust' | 'face';
  /** Turns the whole life engine on/off (small list avatars stay static). */
  animated?: boolean;
  reaction?: ReactionSignal | null;
  className?: string;
  label?: string;
}

export function AvatarLive({
  config,
  crop = 'bust',
  animated = true,
  reaction = null,
  className,
  label
}: AvatarLiveProps) {
  const reduced = usePrefersReducedMotion();
  const { pose, react } = useAvatarLife(animated);

  useEffect(() => {
    if (reaction && reaction.n > 0) react(reaction.kind);
  }, [reaction, react]);

  return (
    <AvatarRig
      config={config}
      pose={pose}
      crop={crop}
      idleMotion={animated && !reduced}
      className={className}
      label={label} />);


}
