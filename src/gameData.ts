/**
 * Phoenix Arena — game content and a tiny mutable session store.
 * Level order follows the real curriculum topics in mockData.
 */

import type { NodeMotionGeometry } from './motion/nodeMotionPath';

export interface PlayQuestion {
  q: string;
  options: string[];
  answer: number;
}

export type LevelKind = 'practice' | 'speed' | 'boss';

export interface GameLevel {
  id: number;
  unitId: number;
  kind: LevelKind;
  title: string;
  /** visual geometry the motion system follows — the node owns its shape */
  geometry: NodeMotionGeometry;
}

/** node shape personality per kind: practice = circle, speed = diamond, boss = squircle */
export const KIND_GEOMETRY: Record<LevelKind, NodeMotionGeometry> = {
  practice: { shape: 'circle' },
  speed: { shape: 'diamond', cornerRadius: 0.22, rotationDeg: 45 },
  boss: { shape: 'rounded-square', cornerRadius: 0.3 }
};

export const BATTLE_NODE_GEOMETRY: NodeMotionGeometry = {
  shape: 'rounded-square',
  cornerRadius: 0.3
};

export interface GameUnit {
  id: number;
  title: string;
  /** icon key resolved to a lucide icon by the UI */
  icon: 'hash' | 'pie' | 'calculator' | 'percent' | 'scale';
  difficulty: string;
  levels: GameLevel[];
  questions: PlayQuestion[];
}

export interface ShopItem {
  id: number;
  name: string;
  /** visual key resolved to a crafted product illustration by the UI */
  icon:
  'ticket' |
  'cookie' |
  'creditcard' |
  'shirt' |
  'notebook' |
  'pen' |
  'sticker' |
  'zap' |
  'snowflake' |
  'rocket';
  desc: string;
  price: number;
  category: 'voucher' | 'merch' | 'boost';
  popular?: boolean;
}

export interface QuestDef {
  id: number;
  title: string;
  current: number;
  goal: number;
  reward: number;
}

export interface LeagueRow {
  id: number;
  name: string;
  xp: number;
  you?: boolean;
}

let levelId = 0;
function unitLevels(unitId: number): GameLevel[] {
  return [
  { id: ++levelId, unitId, kind: 'practice', title: 'Mashq 1', geometry: KIND_GEOMETRY.practice },
  { id: ++levelId, unitId, kind: 'practice', title: 'Mashq 2', geometry: KIND_GEOMETRY.practice },
  { id: ++levelId, unitId, kind: 'speed', title: 'Tezkor raund', geometry: KIND_GEOMETRY.speed },
  { id: ++levelId, unitId, kind: 'boss', title: 'Boss jangi', geometry: KIND_GEOMETRY.boss }];
}

export const units: GameUnit[] = [
{
  id: 1,
  title: 'Butun sonlar',
  icon: 'hash',
  difficulty: 'Asosiy',
  levels: unitLevels(1),
  questions: [
  { q: '(−8) + 15 = ?', options: ['7', '−7', '23', '−23'], answer: 0 },
  { q: '12 × 4 = ?', options: ['44', '48', '52', '46'], answer: 1 },
  { q: '36 ÷ (−6) = ?', options: ['6', '−8', '−6', '8'], answer: 2 },
  { q: '|−14| = ?', options: ['−14', '0', '1', '14'], answer: 3 },
  { q: '25 − 40 = ?', options: ['−15', '15', '−25', '65'], answer: 0 },
  { q: '(−3) × (−7) = ?', options: ['−21', '21', '−10', '10'], answer: 1 }]
},
{
  id: 2,
  title: 'Kasrlar',
  icon: 'pie',
  difficulty: 'Asosiy',
  levels: unitLevels(2),
  questions: [
  { q: '1/2 + 1/4 = ?', options: ['2/6', '1/6', '3/4', '2/4'], answer: 2 },
  { q: 'Qaysi kasr katta?', options: ['2/3', '3/5', '1/2', '4/7'], answer: 0 },
  { q: '1 − 2/5 = ?', options: ['2/5', '3/5', '1/5', '4/5'], answer: 1 },
  { q: '6/8 qisqartirilsa = ?', options: ['2/3', '4/6', '3/4', '1/2'], answer: 2 },
  { q: '1/3 + 1/6 = ?', options: ['2/9', '1/2', '2/6', '1/9'], answer: 1 },
  { q: '3/4 × 2 = ?', options: ['6/8', '3/2', '3/8', '5/4'], answer: 1 }]
},
{
  id: 3,
  title: "O'nli kasrlar",
  icon: 'calculator',
  difficulty: "O'rta",
  levels: unitLevels(3),
  questions: [
  { q: '0,7 + 0,35 = ?', options: ['1,05', '0,42', '1,5', '0,105'], answer: 0 },
  { q: '2,5 × 4 = ?', options: ['8', '10', '9', '12'], answer: 1 },
  { q: '1 − 0,25 = ?', options: ['0,85', '0,25', '0,75', '0,5'], answer: 2 },
  { q: '0,3 × 0,3 = ?', options: ['0,9', '0,6', '0,03', '0,09'], answer: 3 },
  { q: '4,8 ÷ 2 = ?', options: ['2,4', '2,2', '2,8', '1,4'], answer: 0 },
  { q: 'Qaysi son katta?', options: ['0,45', '0,5', '0,405', '0,449'], answer: 1 }]
},
{
  id: 4,
  title: 'Foizlar',
  icon: 'percent',
  difficulty: "O'rta",
  levels: unitLevels(4),
  questions: [
  { q: '200 ning 10% i = ?', options: ['10', '20', '2', '40'], answer: 1 },
  { q: '50 ning 50% i = ?', options: ['5', '50', '25', '10'], answer: 2 },
  { q: '80 ning 25% i = ?', options: ['20', '25', '40', '15'], answer: 0 },
  { q: "Narx 100 000 so'm, chegirma 20%. Yangi narx?", options: ['20 000', '90 000', '95 000', '80 000'], answer: 3 },
  { q: '40 ning 5% i = ?', options: ['4', '2', '8', '5'], answer: 1 },
  { q: '10 ning 100% i = ?', options: ['100', '1', '10', '0,1'], answer: 2 }]
},
{
  id: 5,
  title: 'Nisbat va proporsiya',
  icon: 'scale',
  difficulty: 'Yuqori',
  levels: unitLevels(5),
  questions: [
  { q: '2 : 3 = x : 9 bo‘lsa, x = ?', options: ['4', '6', '3', '12'], answer: 1 },
  { q: '12 : 4 soddalashtirilsa = ?', options: ['3 : 1', '6 : 2', '4 : 1', '2 : 1'], answer: 0 },
  { q: '5 : 10 = 1 : ?', options: ['5', '10', '2', '4'], answer: 2 },
  { q: '3 kg olma 15 000 so‘m. 5 kg = ?', options: ['20 000', '30 000', '25 000', '18 000'], answer: 2 },
  { q: '1 : 2 nisbatda 30 ni bo‘ling. Katta qismi?', options: ['10', '15', '25', '20'], answer: 3 }]
}];


export const allLevels: GameLevel[] = units.flatMap((u) => u.levels);

export function unitOf(level: GameLevel): GameUnit {
  return units.find((u) => u.id === level.unitId) ?? units[0];
}

/** Mutable session store — survives tab switches, resets on reload. */
export const gameState = {
  coins: 240,
  xp: 1340,
  streak: 6,
  energy: 4,
  energyMax: 5,
  /** id of the level the student must play next */
  currentId: 6,
  /** earned stars per completed level id */
  stars: { 1: 2, 2: 3, 3: 2, 4: 3, 5: 2 } as Record<number, number>,
  /** best score in the 60-second sprint */
  sprintBest: 21,
  /** today's adaptive challenge completed */
  dailyDone: false,
  battleWins: 3,
  battlePlayed: 11,
  /** sound effects toggle */
  muted: false,
  /** ids of shop items the student owns (My Collection) */
  owned: [7] as number[],
  /** has any game been completed today (keeps the streak alive) */
  todayDone: false
};

/** First completed game of the day extends the streak. Returns true when it just did. */
export function markDailyProgress(): boolean {
  if (gameState.todayDone) return false;
  gameState.todayDone = true;
  gameState.streak += 1;
  return true;
}

export const XP_PER_LEVEL = 200;

export function playerLevel(): number {
  return Math.floor(gameState.xp / XP_PER_LEVEL) + 1;
}

export function xpIntoLevel(): number {
  return gameState.xp % XP_PER_LEVEL;
}

/** All levels of the unit are behind the pointer → topic finished. */
export function unitCompleted(unit: GameUnit): boolean {
  return unit.levels.every((l) => l.id < gameState.currentId);
}

export function unitStars(unit: GameUnit): number {
  return unit.levels.reduce((sum, l) => sum + (gameState.stars[l.id] ?? 0), 0);
}

/** The unit the student is currently inside (or the last one when everything is done). */
export function currentUnit(): GameUnit {
  return (
    units.find((u) => u.levels.some((l) => l.id >= gameState.currentId)) ??
    units[units.length - 1]);

}

export function nextUnitAfter(unit: GameUnit): GameUnit | null {
  const i = units.findIndex((u) => u.id === unit.id);
  return units[i + 1] ?? null;
}

/**
 * This week's streak pattern, Monday-first, computed from the real date:
 * past days are lit while the streak covers them, today burns after the
 * first finished game, days ahead stay muted.
 */
export function streakWeekState(): ('done' | 'today' | 'future')[] {
  const todayIdx = (new Date().getDay() + 6) % 7;
  const daysBeforeToday = gameState.todayDone ? gameState.streak - 1 : gameState.streak;
  return Array.from({ length: 7 }, (_, i) => {
    if (i === todayIdx) return 'today';
    if (i > todayIdx) return 'future';
    return todayIdx - i <= daysBeforeToday ? 'done' : 'future';
  });
}


/** Weekly coin mission with milestone rewards (reference: segmented bar with locks). */
export const weeklyMission = {
  title: "35 tanga yig'ing",
  current: 20,
  goal: 35,
  daysLeft: 3,
  milestones: [15, 25, 35]
};

export const quests: QuestDef[] = [
{ id: 1, title: "30 XP to'plang", current: 20, goal: 30, reward: 15 },
{ id: 2, title: '2 ta mashq tugating', current: 1, goal: 2, reward: 20 },
{ id: 3, title: '90% aniqlik bilan yakunlang', current: 0, goal: 1, reward: 25 }];


export const shopItems: ShopItem[] = [
{ id: 1, name: "Bepul qo'shimcha dars", icon: 'ticket', desc: "O'qituvchi bilan yakka tartibdagi 80 daqiqalik qo'shimcha dars kuponi.", price: 500, category: 'voucher', popular: true },
{ id: 2, name: 'Bufet: shirinlik', icon: 'cookie', desc: 'Markaz bufetida istalgan shirinlik uchun kupon.', price: 150, category: 'voucher' },
{ id: 3, name: "To'lovga 50 ming chegirma", icon: 'creditcard', desc: "Keyingi oy to'loviga 50 000 so'mlik chegirma sertifikati.", price: 800, category: 'voucher' },
{ id: 4, name: 'Phoenix futbolka', icon: 'shirt', desc: 'Phoenix Math School logotipi tushirilgan premium paxta futbolka.', price: 600, category: 'merch' },
{ id: 5, name: 'Phoenix daftar', icon: 'notebook', desc: "Qattiq muqovali, formulalar jadvali ilova qilingan 96 varaqli daftar.", price: 200, category: 'merch', popular: true },
{ id: 6, name: 'Phoenix ruchka', icon: 'pen', desc: 'Yumshoq yozadigan, logotipli gel ruchka.', price: 100, category: 'merch' },
{ id: 7, name: "Stikerlar to'plami", icon: 'sticker', desc: "12 ta matematik stiker: π, ∞, aksiomalar va boshqalar.", price: 80, category: 'merch' },
{ id: 8, name: "Energiya to'ldirish", icon: 'zap', desc: "Energiyani darhol to'liq tiklaydi — kutish shart emas.", price: 120, category: 'boost' },
{ id: 9, name: 'Streak muzlatish', icon: 'snowflake', desc: "Bir kun o'tkazib yuborsangiz ham seriyangiz saqlanadi.", price: 200, category: 'boost' },
{ id: 10, name: '2× XP kuchaytirgich', icon: 'rocket', desc: 'Keyingi mashq uchun barcha XP ikki baravar hisoblanadi.', price: 250, category: 'boost' }];


/* ── Hayotiy matematika (adults): practical money math ── */
export const lifeQuestions: PlayQuestion[] = [
{ q: "Telefon 2 400 000 so'm. 15% chegirma bilan narxi?", options: ['2 040 000', '2 160 000', '1 900 000', '2 250 000'], answer: 0 },
{ q: "Oyiga 2% foiz. 1 000 000 so'm omonat 1 oyda qancha bo'ladi?", options: ['1 002 000', '1 200 000', '1 020 000', '1 002 500'], answer: 2 },
{ q: "Ish haqi 4 000 000, soliq 12%. Qo'lga tegadigani?", options: ['3 520 000', '3 480 000', '3 600 000', '3 400 000'], answer: 0 },
{ q: "Do'kon 30% ustama qo'yadi. Tannarxi 50 000 bo'lsa, sotuv narxi?", options: ['80 000', '65 000', '53 000', '70 000'], answer: 1 },
{ q: '12 oyga 600 000 qarz, har oy teng to‘lov. Oylik to‘lov?', options: ['60 000', '55 000', '50 000', '45 000'], answer: 2 },
{ q: "3 kg guruch 42 000 so'm. 1 kg narxi?", options: ['12 000', '15 000', '13 000', '14 000'], answer: 3 },
{ q: 'Chegirma: 250 000 → 200 000. Necha foiz arzonladi?', options: ['25%', '20%', '15%', '10%'], answer: 1 },
{ q: "Kunlik savdo 800 000, xarajat 45%. Sof foyda?", options: ['440 000', '360 000', '450 000', '400 000'], answer: 0 }];


/** Adaptive daily challenge — one question from each unit, matched to level. */
export function dailyPool(): PlayQuestion[] {
  return units.map((u, i) => u.questions[i % u.questions.length]);
}

/** Smart review — pulls from weak topics (Kasrlar) and the conditional exam (O'nli kasrlar). */
export function reviewPool(): PlayQuestion[] {
  return [...units[1].questions.slice(0, 3), ...units[2].questions.slice(0, 2)];
}

/** Sprint pool — everything, shuffled deterministically by a rotating offset. */
export function sprintPool(offset: number): PlayQuestion[] {
  const all = [...units.flatMap((u) => u.questions), ...lifeQuestions];
  return all.map((_, i) => all[(i * 7 + offset) % all.length]);
}

/* ── Battle (10-player multiplayer) ─────────────────────── */

export type BattleMode = 'same' | 'mixed';

export interface BattlePlayer {
  id: number;
  name: string;
  level: number;
  /** 0..1 — chance a bot answers each question correctly */
  skill: number;
  you?: boolean;
  score: number;
}

export const BOT_NAMES = [
'Jasur M.', 'Malika R.', 'Aziza T.', 'Bekzod S.', 'Nilufar K.',
'Sardor A.', 'Kamola N.', 'Diyor B.', 'Zilola H.', 'Timur Q.',
'Sevinch O.', 'Islom Y.', 'Madina F.', 'Otabek J.'];


export const BATTLE_SIZE = 10;
export const BATTLE_QUESTIONS = 5;
export const BATTLE_SECONDS = 10;
/** coins by final placement: 1st, 2nd, 3rd, rest */
export const BATTLE_REWARDS = [60, 40, 30, 15];

export function battlePool(mode: BattleMode): PlayQuestion[] {
  if (mode === 'same') {
    return [...units[2].questions.slice(0, 3), ...units[3].questions.slice(0, 2)];
  }
  return [
  units[0].questions[0],
  units[1].questions[1],
  units[3].questions[2],
  lifeQuestions[6],
  units[4].questions[0]];

}

/* ── Guruh turniri (monthly live event) ─────────────────── */
export const tournament = {
  title: 'Guruh turniri',
  subtitle: "A2-ertalab vs B1-kechki · jonli final markazda",
  date: '31-avgust',
  prize: "G'olib guruhga — 500 tanga va kubok"
};

export const leagueRows: LeagueRow[] = [
{ id: 1, name: 'Jasur M.', xp: 312 },
{ id: 2, name: 'Malika R.', xp: 268 },
{ id: 3, name: 'Aziza T.', xp: 224 },
{ id: 4, name: 'Ali Valiyev', xp: 186, you: true },
{ id: 5, name: 'Bekzod S.', xp: 170 },
{ id: 6, name: 'Nilufar K.', xp: 141 },
{ id: 7, name: 'Sardor A.', xp: 118 },
{ id: 8, name: 'Kamola N.', xp: 96 },
{ id: 9, name: 'Diyor B.', xp: 64 },
{ id: 10, name: 'Zilola H.', xp: 38 }];
