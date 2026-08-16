/**
 * Avatar Studio — shared types.
 * The avatar is pure data (AvatarConfig): every visual attribute is an id
 * resolved against the catalogs in avatarOptions.ts, never a raw asset path.
 */

export type AvatarGender = 'boy' | 'girl';

export type AvatarCategory =
  | 'skin'
  | 'face'
  | 'eyes'
  | 'brows'
  | 'mouth'
  | 'hair'
  | 'headwear'
  | 'hijab'
  | 'clothing'
  | 'accessories'
  | 'background';

export interface AvatarConfig {
  /** Schema version for future migrations. */
  v: 1;
  /** Drives which categories and items are available. */
  gender: AvatarGender;
  skin: string;
  face: string;
  eyes: string;
  brows: string;
  mouth: string;
  hair: string;
  hairColor: string;
  /** 'none' means bare head. Boy-only; forced to 'none' for girls. */
  headwear: string;
  headwearColor: string;
  /** 'none' means no hijab. Girl-only; forced to 'none' for boys. */
  hijab: string;
  hijabColor: string;
  clothing: string;
  clothingColor: string;
  /** Multi-select; empty array means no accessories. */
  accessories: string[];
  background: string;
}

/** What the character briefly does when the user touches a control. */
export type AvatarReaction = AvatarCategory | 'celebrate';

/** Live pose produced by the idle engine and consumed by the SVG rig. */
export interface AvatarPose {
  /** 0 = eyes open, 1 = eyes closed. */
  blink: number;
  /** -1..1, scaled to a few px inside the rig. */
  pupilX: number;
  pupilY: number;
  /** Head rotation in degrees. */
  tilt: number;
  /** 1 briefly raises the brows. */
  browLift: number;
  /** Temporary expression override; 'idle' shows the configured mouth. */
  mood: 'idle' | 'smile' | 'surprised';
  /** True during the tiny happy hop. */
  lift: boolean;
}

export const NEUTRAL_POSE: AvatarPose = {
  blink: 0,
  pupilX: 0,
  pupilY: 0,
  tilt: 0,
  browLift: 0,
  mood: 'idle',
  lift: false
};
