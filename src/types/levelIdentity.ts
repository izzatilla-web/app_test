/**
 * Level Identity Engine — the single source of truth for the level-based
 * visual identity system.
 *
 * Phoenix levels: 5 bands (A B C D E) × 3 stages = 15 real levels, mirroring
 * `curriculum.ts` exactly (A1..E3). Band-only codes ("A".."E") stay resolvable
 * because the CRM may send a bare band; they map to the band's first stage.
 *
 * Band E (Geometriya) is a PARALLEL elective track: the main path runs
 * A1 → D3, while E1 → E3 can be studied alongside any level. That is why
 * D3 has no next level and E chains only within itself.
 *
 * Visual model — "Yo‘l va nur" (path & light):
 *   • every band owns one hue on a cool→warm journey (sky → blue → indigo →
 *     violet → gold), exposed both as a solid accent (readable text/icons)
 *     and as an HSL triple for glow/aura composition at any alpha;
 *   • intensity grows with `sequence` (1..15) — higher level, stronger light;
 *   • all colors are applied through inline styles, never dynamic Tailwind
 *     class names, so the JIT compiler is never asked to guess.
 */

export type LevelBandLetter = 'A' | 'B' | 'C' | 'D' | 'E';

export type AcademicLevelCode =
  | 'A' | 'A1' | 'A2' | 'A3'
  | 'B' | 'B1' | 'B2' | 'B3'
  | 'C' | 'C1' | 'C2' | 'C3'
  | 'D' | 'D1' | 'D2' | 'D3'
  | 'E' | 'E1' | 'E2' | 'E3';

export interface LevelBandMeta {
  band: LevelBandLetter;
  /** 0-based journey position of the band (A=0 … E=4). */
  tier: number;
  /** One-word identity of the band, e.g. "Poydevor". */
  essence: string;
  /** Curriculum umbrella title of the band. */
  title: string;
  /** Compact title for dense rows (level map). */
  shortTitle: string;
  description: string;
  /** Solid readable accent on light surfaces. */
  accent: string;
  /** Brighter accent for dark surfaces. */
  accentDark: string;
  /** HSL triple ("h s% l%") for glow composition: hsl(<glow> / alpha). */
  glow: string;
  subLevels: AcademicLevelCode[];
}

export interface LevelMeta {
  code: AcademicLevelCode;
  band: LevelBandLetter;
  /** Stage inside the band, 1..3. */
  stage: 1 | 2 | 3;
  /** Position across the whole journey, 1..15. */
  sequence: number;
  /** Real curriculum title of the level (mirrors curriculum.ts). */
  title: string;
  targetExam: string;
  /** One-line motivational identity of the level. */
  motto: string;
  nextCode: AcademicLevelCode | null;
}

export const LEVEL_BANDS: Record<LevelBandLetter, LevelBandMeta> = {
  A: {
    band: 'A',
    tier: 0,
    essence: 'Poydevor',
    title: 'Boshlang‘ich va o‘rta matematika',
    shortTitle: 'Boshlang‘ich',
    description: 'Sonlar, kasrlar, foizlar va poydevor arifmetikasi',
    accent: '#0284c7',
    accentDark: '#38bdf8',
    glow: '199 89% 48%',
    subLevels: ['A1', 'A2', 'A3']
  },
  B: {
    band: 'B',
    tier: 1,
    essence: 'Yuksalish',
    title: 'Algebra va geometriya',
    shortTitle: 'Algebra · Geometriya',
    description: 'Funksiyalar, tenglamalar, grafiklar va planimetriya',
    accent: '#2563eb',
    accentDark: '#60a5fa',
    glow: '221 83% 53%',
    subLevels: ['B1', 'B2', 'B3']
  },
  C: {
    band: 'C',
    tier: 2,
    essence: 'Marra',
    title: 'DTM va SAT tayyorgarlik',
    shortTitle: 'DTM · SAT',
    description: 'SAT Math, DTM va Milliy Sertifikat imtihonlari',
    accent: '#4f46e5',
    accentDark: '#818cf8',
    glow: '243 75% 59%',
    subLevels: ['C1', 'C2', 'C3']
  },
  D: {
    band: 'D',
    tier: 3,
    essence: 'Olimp',
    title: 'Milliy va xalqaro olimpiada',
    shortTitle: 'Olimpiada',
    description: 'Sonlar nazariyasi, kombinatorika va olimpiada geometriyasi',
    accent: '#7c3aed',
    accentDark: '#a78bfa',
    glow: '262 83% 58%',
    subLevels: ['D1', 'D2', 'D3']
  },
  E: {
    band: 'E',
    tier: 4,
    essence: 'Geometriya',
    title: 'Geometriya',
    shortTitle: 'Geometriya',
    description: 'Planimetriya, stereometriya va analitik geometriya',
    accent: '#d97706',
    accentDark: '#fbbf24',
    glow: '38 92% 50%',
    subLevels: ['E1', 'E2', 'E3']
  }
};

/** Ordered journey A1 → E3. Titles mirror curriculum.ts level titles. */
const LEVELS: Array<{
  code: AcademicLevelCode;
  title: string;
  targetExam: string;
  motto: string;
}> = [
  { code: 'A1', title: 'Boshlang‘ich matematika', targetExam: 'Maktab 5-sinf', motto: 'Har bir cho‘qqi shu nuqtadan boshlanadi' },
  { code: 'A2', title: 'O‘rta matematika', targetExam: 'Maktab 6-sinf', motto: 'Poydevor mustahkamlanmoqda — davom et' },
  { code: 'A3', title: 'Algebra asoslari', targetExam: 'Maktab 6-sinf yakuni', motto: 'Algebra olamiga o‘tish arafasidasan' },
  { code: 'B1', title: 'Algebra va funksiyalar', targetExam: 'Al-Xorazmiy maktabi', motto: 'Sur’at senda — yuksalish boshlandi' },
  { code: 'B2', title: 'Grafiklar va geometriya', targetExam: 'Prezident maktabi', motto: 'Ishonch bilan oldinga' },
  { code: 'B3', title: 'Progressiyalar', targetExam: 'Litsey imtihonlari', motto: 'Intizom natijaga aylanmoqda' },
  { code: 'C1', title: 'SAT va xalqaro matematika', targetExam: 'SAT Math 750+', motto: 'Xalqaro marra ko‘rinib qoldi' },
  { code: 'C2', title: 'DTM va Milliy Sertifikat', targetExam: 'DTM / Milliy Sertifikat', motto: 'Aniq nishon — yuqori ball' },
  { code: 'C3', title: 'Matematik analiz asoslari', targetExam: 'DTM 189 ball', motto: 'Chuqur bilim — mustahkam g‘alaba' },
  { code: 'D1', title: 'Olimpiada matematikasi I', targetExam: 'Viloyat olimpiadasi', motto: 'Endi g‘oyalar bilan kurashasan' },
  { code: 'D2', title: 'Olimpiada geometriyasi II', targetExam: 'Respublika olimpiadasi', motto: 'Nostandart tafakkur maydoni' },
  { code: 'D3', title: 'Murakkab tengsizliklar', targetExam: 'Xalqaro olimpiada (IMO)', motto: 'Eng qiyini — eng yaqin marra' },
  { code: 'E1', title: 'Planimetriya', targetExam: 'Geometriya I', motto: 'Shakllar olami senga ochildi' },
  { code: 'E2', title: 'Stereometriya', targetExam: 'Geometriya II', motto: 'Fazoviy tasavvur kuchaymoqda' },
  { code: 'E3', title: 'Analitik geometriya', targetExam: 'Geometriya III', motto: 'Geometriya — matematikaning ko‘zi' }
];

export const LEVEL_SEQUENCE: LevelMeta[] = LEVELS.map((entry, index) => ({
  code: entry.code,
  band: entry.code.charAt(0) as LevelBandLetter,
  stage: ((index % 3) + 1) as 1 | 2 | 3,
  sequence: index + 1,
  title: entry.title,
  targetExam: entry.targetExam,
  motto: entry.motto,
  // The main path ends at D3; the E (geometry) track chains only within itself.
  nextCode: entry.code === 'D3' ? null : LEVELS[index + 1]?.code ?? null
}));

export const LEVEL_IDENTITIES: Record<string, LevelMeta> = Object.fromEntries(
  LEVEL_SEQUENCE.map((meta) => [meta.code, meta])
);

/** Legacy CRM rung codes that map onto the 15-level scale (see passport.ts). */
const CRM_ALIASES: Record<string, AcademicLevelCode> = {
  'C-SAT': 'C1',
  'C-DTM': 'C2',
  'C-MS': 'C3'
};

/**
 * Resolves any CRM level string to a LevelMeta: exact code first, then the
 * legacy CRM rung aliases (C-SAT/C-DTM/C-MS), then the band's first stage for
 * bare band letters ("C" → C1), then A1.
 */
export function resolveLevelMeta(code?: string | null): LevelMeta {
  const clean = (code || '').toUpperCase().trim();
  if (LEVEL_IDENTITIES[clean]) return LEVEL_IDENTITIES[clean];
  if (CRM_ALIASES[clean]) return LEVEL_IDENTITIES[CRM_ALIASES[clean]];
  const band = clean.charAt(0) as LevelBandLetter;
  if (LEVEL_BANDS[band]) return LEVEL_IDENTITIES[LEVEL_BANDS[band].subLevels[0]];
  return LEVEL_IDENTITIES.A1;
}

export function nextLevelMeta(meta: LevelMeta): LevelMeta | null {
  return meta.nextCode ? LEVEL_IDENTITIES[meta.nextCode] : null;
}

export function bandOf(meta: LevelMeta): LevelBandMeta {
  return LEVEL_BANDS[meta.band];
}

/** Solid accent for the current theme. */
export function levelAccent(meta: LevelMeta, dark: boolean): string {
  const band = LEVEL_BANDS[meta.band];
  return dark ? band.accentDark : band.accent;
}

/** Band hue at an arbitrary alpha — the building block of every glow. */
export function levelGlow(meta: LevelMeta, alpha: number): string {
  return `hsl(${LEVEL_BANDS[meta.band].glow} / ${alpha})`;
}

/** 0..1 journey strength — drives aura size and light intensity. */
export function auraStrength(meta: LevelMeta): number {
  return (meta.sequence - 1) / (LEVEL_SEQUENCE.length - 1);
}
