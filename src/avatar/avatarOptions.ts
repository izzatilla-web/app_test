/**
 * Avatar Studio — data-driven option catalogs.
 * Adding a new style = one entry here + (for shapes) one case in AvatarRig.
 * Ids are the only thing persisted; hex values stay client-side here,
 * so stored configs can never inject arbitrary colors or asset paths.
 *
 * Gender awareness: every shape option may declare `for: ['boy'|'girl']`.
 * No tag means the item is universal. UI and validation both go through
 * `optionsFor` / `sanitizeAvatarConfig`, so gender rules live in data,
 * not in scattered if-statements.
 */

import type { AvatarCategory, AvatarConfig, AvatarGender } from './avatarTypes';

export interface ColorOption {
  id: string;
  hex: string;
  /** Darker companion used for shadows / detail lines. */
  shade: string;
}

// ── Skin tones ───────────────────────────────────────────
export const SKIN_TONES: ColorOption[] = [
  { id: 'porcelain', hex: '#F6D7BD', shade: '#E9BE9C' },
  { id: 'sand', hex: '#EFC5A2', shade: '#DFAA82' },
  { id: 'honey', hex: '#E2A878', shade: '#CD8E5E' },
  { id: 'caramel', hex: '#C98A5B', shade: '#B27346' },
  { id: 'bronze', hex: '#A96F44', shade: '#925C36' },
  { id: 'chestnut', hex: '#8A5432', shade: '#734526' },
  { id: 'cocoa', hex: '#6B3F24', shade: '#57321C' },
  { id: 'espresso', hex: '#4E2E1B', shade: '#3D2414' }];


// ── Hair colors ──────────────────────────────────────────
export const HAIR_COLORS: ColorOption[] = [
  { id: 'ink', hex: '#2B2622', shade: '#1B1714' },
  { id: 'espresso', hex: '#4A3428', shade: '#37261D' },
  { id: 'brown', hex: '#6D4C33', shade: '#553A26' },
  { id: 'chestnut', hex: '#8C5A3A', shade: '#70462B' },
  { id: 'blonde', hex: '#E3B563', shade: '#C79747' },
  { id: 'copper', hex: '#C56A3A', shade: '#A4552C' },
  { id: 'auburn', hex: '#93402E', shade: '#783224' },
  { id: 'silver', hex: '#A8ABB3', shade: '#8E929C' },
  { id: 'lilac', hex: '#9D7BE0', shade: '#8161C4' },
  { id: 'ocean', hex: '#5B8DEF', shade: '#4571CE' },
  { id: 'rose', hex: '#E57FAE', shade: '#C96390' },
  { id: 'mint', hex: '#56B58C', shade: '#419571' }];


// ── Headwear colors ──────────────────────────────────────
export const HEADWEAR_COLORS: ColorOption[] = [
  { id: 'charcoal', hex: '#3A3E46', shade: '#282B31' },
  { id: 'cream', hex: '#F1E7D4', shade: '#DBCCAF' },
  { id: 'crimson', hex: '#DF5A50', shade: '#BE443B' },
  { id: 'royal', hex: '#4C86E8', shade: '#3A6CC5' },
  { id: 'forest', hex: '#4F9E5F', shade: '#3D8149' },
  { id: 'amber', hex: '#EDAE3D', shade: '#CE912B' },
  { id: 'lilac', hex: '#9D7BE0', shade: '#8161C4' },
  { id: 'blossom', hex: '#E57FAE', shade: '#C96390' }];


// ── Hijab colors — calm, premium palette ─────────────────
export const HIJAB_COLORS: ColorOption[] = [
  { id: 'white', hex: '#F5F2EC', shade: '#DDD6C9' },
  { id: 'cream', hex: '#EADFC8', shade: '#D3C3A2' },
  { id: 'blush', hex: '#E8B8C8', shade: '#D096AC' },
  { id: 'lavender', hex: '#C3B2E6', shade: '#A891D6' },
  { id: 'plum', hex: '#7C5FBF', shade: '#654BA3' },
  { id: 'navy', hex: '#33415E', shade: '#242E45' },
  { id: 'onyx', hex: '#33373E', shade: '#22252B' },
  { id: 'sage', hex: '#A8BCA0', shade: '#8CA382' },
  { id: 'teal', hex: '#3E9EA8', shade: '#2F818A' },
  { id: 'rosewood', hex: '#C77B8E', shade: '#AB6073' }];


// ── Clothing colors ──────────────────────────────────────
export const CLOTHING_COLORS: ColorOption[] = [
  { id: 'royal', hex: '#4C86E8', shade: '#3A6CC5' },
  { id: 'navy', hex: '#33415E', shade: '#242E45' },
  { id: 'charcoal', hex: '#3A3E46', shade: '#282B31' },
  { id: 'cream', hex: '#F1E7D4', shade: '#DBCCAF' },
  { id: 'crimson', hex: '#DF5A50', shade: '#BE443B' },
  { id: 'amber', hex: '#EDAE3D', shade: '#CE912B' },
  { id: 'meadow', hex: '#4FA36B', shade: '#3E8554' },
  { id: 'teal', hex: '#3E9EA8', shade: '#2F818A' },
  { id: 'lilac', hex: '#8E6FDB', shade: '#7458BC' },
  { id: 'blossom', hex: '#E27BA8', shade: '#C4618C' }];


// ── Backgrounds ──────────────────────────────────────────
export const BACKGROUNDS: ColorOption[] = [
  { id: 'sky', hex: '#CDE3FA', shade: '#AECFF2' },
  { id: 'mint', hex: '#CBEBDA', shade: '#A9DCC1' },
  { id: 'lavender', hex: '#DFD8F9', shade: '#C8BCF1' },
  { id: 'lemon', hex: '#F7EABC', shade: '#EDD88F' },
  { id: 'peach', hex: '#FADCC4', shade: '#F3C29B' },
  { id: 'blush', hex: '#F8D3DF', shade: '#F0B2C7' },
  { id: 'fog', hex: '#E3E6EB', shade: '#CDD2DA' },
  { id: 'reef', hex: '#C4E6E8', shade: '#9DD3D7' }];


// ── Shape catalogs ───────────────────────────────────────
export interface ShapeOption {
  id: string;
  /** Omitted = available for every avatar type. */
  for?: AvatarGender[];
}

export const FACE_SHAPES: ShapeOption[] = [
  { id: 'soft' },
  { id: 'round' },
  { id: 'square' },
  { id: 'slim' },
  { id: 'wide' }];


export const EYE_STYLES: ShapeOption[] = [
  { id: 'classic' },
  { id: 'round' },
  { id: 'sleepy' },
  { id: 'happy' },
  { id: 'wink' },
  { id: 'starry' },
  { id: 'dot' },
  { id: 'wide' }];


export const BROW_STYLES: ShapeOption[] = [
  { id: 'soft' },
  { id: 'straight' },
  { id: 'thick', for: ['boy'] },
  { id: 'thin' },
  { id: 'arched' },
  { id: 'angled' },
  { id: 'playful' }];


export const MOUTH_STYLES: ShapeOption[] = [
  { id: 'smile' },
  { id: 'grin' },
  { id: 'laugh' },
  { id: 'neutral' },
  { id: 'surprised' },
  { id: 'smirk' },
  { id: 'tongue' },
  { id: 'cat' }];


export const HAIR_STYLES: ShapeOption[] = [
  { id: 'none' },
  { id: 'buzz', for: ['boy'] },
  { id: 'short' },
  { id: 'sidepart', for: ['boy'] },
  { id: 'messy', for: ['boy'] },
  { id: 'spiky', for: ['boy'] },
  { id: 'curly' },
  { id: 'wavy' },
  { id: 'afro' },
  { id: 'pixie', for: ['girl'] },
  { id: 'lob', for: ['girl'] },
  { id: 'long', for: ['girl'] },
  { id: 'longwavy', for: ['girl'] },
  { id: 'bob', for: ['girl'] },
  { id: 'ponytail', for: ['girl'] },
  { id: 'highpony', for: ['girl'] },
  { id: 'twintails', for: ['girl'] },
  { id: 'braid', for: ['girl'] },
  { id: 'bun', for: ['girl'] }];


/**
 * When a covering hat is worn, voluminous hair collapses to a flatter style
 * so the hat never clips through it.
 */
export const HAIR_UNDER_HAT: Record<string, string> = {
  messy: 'short',
  spiky: 'short',
  curly: 'short',
  afro: 'short',
  bun: 'sidepart'
};

export const HEADWEAR_STYLES: ShapeOption[] = [
  { id: 'none' },
  { id: 'cap', for: ['boy'] },
  { id: 'beanie', for: ['boy'] },
  { id: 'bucket', for: ['boy'] },
  { id: 'pom', for: ['boy'] },
  { id: 'headphones', for: ['boy'] },
  { id: 'crown', for: ['boy'] }];


/** Hats that flatten hair (headphones and crown sit on top of any style). */
export const COVERING_HEADWEAR = new Set(['cap', 'beanie', 'bucket', 'pom']);

/**
 * Hijab styles (girl only). `fringe: true` intentionally shows a small
 * strand of hair at the forehead; every other style fully covers the hair.
 * Coverage is data, not a visual hack: the renderer skips hair layers
 * entirely whenever a hijab is worn.
 */
export interface HijabOption extends ShapeOption {
  fringe?: boolean;
}

export const HIJAB_STYLES: HijabOption[] = [
  { id: 'none', for: ['girl'] },
  { id: 'classic', for: ['girl'] },
  { id: 'layered', for: ['girl'] },
  { id: 'modern', for: ['girl'] },
  { id: 'open', for: ['girl'], fringe: true },
  { id: 'sport', for: ['girl'] },
  { id: 'wrapped', for: ['girl'] }];


export const CLOTHING_STYLES: ShapeOption[] = [
  { id: 'tee' },
  { id: 'hoodie' },
  { id: 'shirt' },
  { id: 'blouse', for: ['girl'] },
  { id: 'dress', for: ['girl'] },
  { id: 'jacket' },
  { id: 'sweater' },
  { id: 'turtleneck' },
  { id: 'sporty' },
  { id: 'suit', for: ['boy'] }];


export const ACCESSORY_STYLES: ShapeOption[] = [
  { id: 'glasses' },
  { id: 'sunglasses' },
  { id: 'freckles' },
  { id: 'blush' },
  { id: 'earrings', for: ['girl'] },
  { id: 'necklace', for: ['girl'] }];


/** Only one kind of eyewear can be worn at a time. */
export const EYEWEAR = new Set(['glasses', 'sunglasses']);

/** Items available for a given avatar type. */
export function optionsFor<T extends ShapeOption>(list: T[], gender: AvatarGender): T[] {
  return list.filter((o) => !o.for || o.for.includes(gender));
}

// ── Defaults ─────────────────────────────────────────────
/** Intentional, friendly starting points — never empty placeholders. */
export const DEFAULT_AVATAR: AvatarConfig = {
  v: 1,
  gender: 'boy',
  skin: 'honey',
  face: 'soft',
  eyes: 'classic',
  brows: 'soft',
  mouth: 'smile',
  hair: 'short',
  hairColor: 'espresso',
  headwear: 'none',
  headwearColor: 'charcoal',
  hijab: 'none',
  hijabColor: 'cream',
  clothing: 'tee',
  clothingColor: 'royal',
  accessories: [],
  background: 'sky'
};

export const DEFAULT_GIRL_AVATAR: AvatarConfig = {
  v: 1,
  gender: 'girl',
  skin: 'honey',
  face: 'soft',
  eyes: 'classic',
  brows: 'soft',
  mouth: 'smile',
  hair: 'long',
  hairColor: 'espresso',
  headwear: 'none',
  headwearColor: 'charcoal',
  hijab: 'none',
  hijabColor: 'cream',
  clothing: 'dress',
  clothingColor: 'lilac',
  accessories: [],
  background: 'lavender'
};

export function defaultAvatarFor(gender: AvatarGender): AvatarConfig {
  const base = gender === 'girl' ? DEFAULT_GIRL_AVATAR : DEFAULT_AVATAR;
  return { ...base, accessories: [] };
}

// ── Lookup helpers ───────────────────────────────────────
function colorOf(list: ColorOption[], id: string, fallback: string): ColorOption {
  return list.find((c) => c.id === id) ?? list.find((c) => c.id === fallback) ?? list[0];
}

export const getSkin = (id: string) => colorOf(SKIN_TONES, id, DEFAULT_AVATAR.skin);
export const getHairColor = (id: string) => colorOf(HAIR_COLORS, id, DEFAULT_AVATAR.hairColor);
export const getHeadwearColor = (id: string) =>
colorOf(HEADWEAR_COLORS, id, DEFAULT_AVATAR.headwearColor);
export const getHijabColor = (id: string) => colorOf(HIJAB_COLORS, id, DEFAULT_AVATAR.hijabColor);
export const getClothingColor = (id: string) =>
colorOf(CLOTHING_COLORS, id, DEFAULT_AVATAR.clothingColor);
export const getBackground = (id: string) => colorOf(BACKGROUNDS, id, DEFAULT_AVATAR.background);

export function getHijabStyle(id: string): HijabOption | undefined {
  return HIJAB_STYLES.find((s) => s.id === id);
}

const SHAPE_LISTS: Record<
  Exclude<AvatarCategory, 'skin' | 'background'>,
  ShapeOption[]> =
{
  face: FACE_SHAPES,
  eyes: EYE_STYLES,
  brows: BROW_STYLES,
  mouth: MOUTH_STYLES,
  hair: HAIR_STYLES,
  headwear: HEADWEAR_STYLES,
  hijab: HIJAB_STYLES,
  clothing: CLOTHING_STYLES,
  accessories: ACCESSORY_STYLES
};

function pickShape(
category: Exclude<AvatarCategory, 'skin' | 'background'>,
gender: AvatarGender,
value: unknown,
fallback: string)
: string {
  const allowed = optionsFor(SHAPE_LISTS[category], gender);
  return typeof value === 'string' && allowed.some((o) => o.id === value) ? value : fallback;
}

function pickColor(list: ColorOption[], value: unknown, fallback: string): string {
  return typeof value === 'string' && list.some((c) => c.id === value) ? value : fallback;
}

/**
 * Validates untrusted data (localStorage, future API) into a safe config.
 * Unknown ids — and ids not available for the config's avatar type —
 * collapse to that type's default. Never trust stored values blindly.
 */
export function sanitizeAvatarConfig(raw: unknown): AvatarConfig {
  if (typeof raw !== 'object' || raw === null) return defaultAvatarFor('boy');
  const r = raw as Record<string, unknown>;
  const gender: AvatarGender = r.gender === 'girl' ? 'girl' : 'boy';
  const d = defaultAvatarFor(gender);

  const rawAccessories = Array.isArray(r.accessories) ?
  r.accessories.filter(
    (a, i, arr): a is string =>
    typeof a === 'string' &&
    optionsFor(ACCESSORY_STYLES, gender).some((o) => o.id === a) &&
    arr.indexOf(a) === i
  ) :
  [];
  // Enforce single eyewear even if stored data was tampered with.
  const firstEyewear = rawAccessories.find((a) => EYEWEAR.has(a));
  const accessories = rawAccessories.filter((a) => !EYEWEAR.has(a) || a === firstEyewear);

  return {
    v: 1,
    gender,
    skin: pickColor(SKIN_TONES, r.skin, d.skin),
    face: pickShape('face', gender, r.face, d.face),
    eyes: pickShape('eyes', gender, r.eyes, d.eyes),
    brows: pickShape('brows', gender, r.brows, d.brows),
    mouth: pickShape('mouth', gender, r.mouth, d.mouth),
    hair: pickShape('hair', gender, r.hair, d.hair),
    hairColor: pickColor(HAIR_COLORS, r.hairColor, d.hairColor),
    headwear: gender === 'boy' ? pickShape('headwear', gender, r.headwear, 'none') : 'none',
    headwearColor: pickColor(HEADWEAR_COLORS, r.headwearColor, d.headwearColor),
    hijab: gender === 'girl' ? pickShape('hijab', gender, r.hijab, 'none') : 'none',
    hijabColor: pickColor(HIJAB_COLORS, r.hijabColor, d.hijabColor),
    clothing: pickShape('clothing', gender, r.clothing, d.clothing),
    clothingColor: pickColor(CLOTHING_COLORS, r.clothingColor, d.clothingColor),
    accessories,
    background: pickColor(BACKGROUNDS, r.background, d.background)
  };
}

export function sameAvatarConfig(a: AvatarConfig, b: AvatarConfig): boolean {
  return (
    a.gender === b.gender &&
    a.skin === b.skin &&
    a.face === b.face &&
    a.eyes === b.eyes &&
    a.brows === b.brows &&
    a.mouth === b.mouth &&
    a.hair === b.hair &&
    a.hairColor === b.hairColor &&
    a.headwear === b.headwear &&
    a.headwearColor === b.headwearColor &&
    a.hijab === b.hijab &&
    a.hijabColor === b.hijabColor &&
    a.clothing === b.clothing &&
    a.clothingColor === b.clothingColor &&
    a.background === b.background &&
    a.accessories.length === b.accessories.length &&
    a.accessories.every((x) => b.accessories.includes(x))
  );
}
