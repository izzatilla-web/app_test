import { avatarHue } from '../tokens';
import { AvatarRig } from '../avatar/AvatarRig';
import { AvatarLive } from '../avatar/AvatarLive';
import { useAvatarConfig } from '../avatar/avatarStore';

interface AvatarProps {
  name: string;
  seed: number;
  size?: 24 | 32 | 40 | 64 | 96;
  photo?: string;
  /** Runs the idle engine (blink/breathe). Defaults on from 64px up. */
  animated?: boolean;
}

const FONT_SIZE: Record<number, number> = { 24: 11, 32: 14, 40: 17, 64: 26, 96: 38 };

export function Avatar({ name, seed, size = 40, photo, animated }: AvatarProps) {
  // A saved avatar replaces the letter monogram everywhere this person appears.
  const config = useAvatarConfig(seed);
  const hue = avatarHue(seed);

  if (config) {
    const live = animated ?? size >= 64;
    return (
      <span
        aria-hidden="true"
        className="block shrink-0 overflow-hidden rounded-full"
        style={{ width: size, height: size }}>

        {live ?
        <AvatarLive config={config} crop="bust" className="block h-full w-full" /> :

        <AvatarRig config={config} crop="face" className="block h-full w-full" />
        }
      </span>);

  }

  if (photo) {
    return (
      <img
        src={photo}
        alt=""
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }} />);


  }
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-full font-display font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: FONT_SIZE[size],
        backgroundColor: `hsl(${hue} 70% 92%)`,
        color: `hsl(${hue} 65% 35%)`
      }}>

      {name.charAt(0).toUpperCase()}
    </span>);

}
