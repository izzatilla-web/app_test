import { t } from './strings';

export type Tone = 'green' | 'amber' | 'red' | 'grey';

export const toneVar: Record<Tone, string> = {
  green: '--good',
  amber: '--warn',
  red: '--bad',
  grey: '--muted-fg'
};

export function toneBg(tone: Tone): string {
  return `hsl(var(${toneVar[tone]}) / var(--tint))`;
}

export function toneFg(tone: Tone): string {
  return `hsl(var(${toneVar[tone]}))`;
}

export function haptic(kind: 'light' | 'success' | 'warning'): void {
  // Native bridge stub — the shipping app calls UIImpactFeedbackGenerator here.
  // eslint-disable-next-line no-console
  console.log(`[haptic] ${kind}`);
}

const AVATAR_HUES = [221, 262, 142, 24, 340, 190];

export function avatarHue(seed: number): number {
  return AVATAR_HUES[Math.abs(seed) % AVATAR_HUES.length];
}

/** 450000 -> "450 000" using thin non-breaking spaces */
export function formatSum(value: number): string {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F');
}

export const IOS_CURVE = 'cubic-bezier(0.32, 0.72, 0, 1)';

/** "2026-08-11" -> "11-avgust, dushanba" (localized) */
export function longDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  const dow = (d.getDay() + 6) % 7;
  return `${d.getDate()}-${t.monthsGen[d.getMonth()]}, ${t.weekdaysLong[dow]}`;
}

/** "2026-08-11" -> "11 avg" (localized) */
export function shortDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()} ${t.monthsGen[d.getMonth()].slice(0, 3)}`;
}

/** "2026-08-05" -> "5-avgust 2026" (localized) */
export function mediumDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()}-${t.monthsGen[d.getMonth()]} ${d.getFullYear()}`;
}
/** 512 -> "8:32" */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

export const ASSETS_3D = {
  mathBookCap: '/assets/3d/math_book_cap.png',
  numbers248: '/assets/3d/numbers_248.png',
  goldMedalRibbon: '/assets/3d/gold_medal_ribbon.png',
  gradCapBooks: '/assets/3d/grad_cap_books.png',
  calendar3d: '/assets/3d/calendar_3d.png',
  passport3d: '/assets/3d/passport_3d.png',
  schedule3d: '/assets/3d/schedule_3d.png',
};
