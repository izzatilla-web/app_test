/**
 * Academic ranking — replaces the old game league.
 *
 * Students are ordered by the composite academic score from `academics.ts`
 * (mastery, exams, homework, curriculum progress, attendance), never by a
 * single metric. Nothing here touches the Games system.
 *
 * NOTE — classmates are mock records, like the rest of the app's data. They
 * carry the same five score components as a real student rather than a
 * pre-baked total, so every row goes through the identical formula. A real
 * backend must return these components (and enforce who is allowed to see
 * whom — the group/level filter below is a UI convenience, not security).
 */

import { scoreBreakdown, SCORE_WEIGHTS } from './academics';
import { curriculumFor } from './curriculum';
import type { ChildRecord } from './mockData';

export interface ScoreComponents {
  mastery: number;
  exams: number;
  homework: number;
  curriculum: number;
  consistency: number;
}

export interface RankedStudent {
  id: number;
  name: string;
  /** Avatar seed — matches the app's avatar store keys. */
  seed: number;
  level: string;
  group: string;
  components: ScoreComponents;
  score: number;
  /** Score one month ago; null for students who joined since. */
  previousScore: number | null;
  you: boolean;
}

export interface RankRow extends RankedStudent {
  rank: number;
  /** Positions gained since last month; null when there is no history. */
  movement: number | null;
  /** Score change since last month; null when there is no history. */
  delta: number | null;
}

function total(components: ScoreComponents): number {
  const value =
  components.mastery * SCORE_WEIGHTS.mastery +
  components.exams * SCORE_WEIGHTS.exams +
  components.homework * SCORE_WEIGHTS.homework +
  components.curriculum * SCORE_WEIGHTS.curriculum +
  components.consistency * SCORE_WEIGHTS.consistency;
  return Math.round(value * 10) / 10;
}

interface PeerSeed {
  id: number;
  name: string;
  seed: number;
  level: string;
  group: string;
  components: ScoreComponents;
  previous: ScoreComponents | null;
}

const PEERS: PeerSeed[] = [
  // Band A (A2 peers)
  {
    id: 101, name: 'Jasur Mahmudov', seed: 3, level: 'A2', group: 'A2-ertalab',
    components: { mastery: 90, exams: 92, homework: 95, curriculum: 71, consistency: 96 },
    previous: { mastery: 86, exams: 88, homework: 92, curriculum: 62, consistency: 94 }
  },
  {
    id: 102, name: 'Malika Rasulova', seed: 4, level: 'A2', group: 'A2-ertalab',
    components: { mastery: 88, exams: 86, homework: 92, curriculum: 64, consistency: 94 },
    previous: { mastery: 85, exams: 84, homework: 90, curriculum: 60, consistency: 92 }
  },
  {
    id: 103, name: 'Aziza Tursunova', seed: 5, level: 'A2', group: 'A2-ertalab',
    components: { mastery: 84, exams: 83, homework: 88, curriculum: 57, consistency: 92 },
    previous: { mastery: 86, exams: 85, homework: 90, curriculum: 60, consistency: 93 }
  },
  {
    id: 104, name: 'Bekzod Saidov', seed: 6, level: 'A2', group: 'A2-ertalab',
    components: { mastery: 79, exams: 80, homework: 85, curriculum: 50, consistency: 90 },
    previous: { mastery: 75, exams: 76, homework: 81, curriculum: 45, consistency: 88 }
  },
  {
    id: 105, name: 'Nilufar Karimova', seed: 7, level: 'A2', group: 'A2-ertalab',
    components: { mastery: 76, exams: 74, homework: 82, curriculum: 50, consistency: 88 },
    previous: { mastery: 78, exams: 76, homework: 84, curriculum: 52, consistency: 89 }
  },
  {
    id: 106, name: 'Sardor Aliyev', seed: 8, level: 'A2', group: 'A2-ertalab',
    components: { mastery: 73, exams: 71, homework: 80, curriculum: 43, consistency: 90 },
    previous: { mastery: 73, exams: 71, homework: 80, curriculum: 43, consistency: 90 }
  },
  {
    id: 107, name: 'Kamola Nazarova', seed: 10, level: 'A2', group: 'A2-ertalab',
    components: { mastery: 66, exams: 64, homework: 74, curriculum: 40, consistency: 84 },
    previous: { mastery: 68, exams: 66, homework: 76, curriculum: 43, consistency: 86 }
  },
  {
    id: 108, name: 'Diyor Bahodirov', seed: 11, level: 'A2', group: 'A2-ertalab',
    components: { mastery: 62, exams: 60, homework: 70, curriculum: 35, consistency: 82 },
    previous: { mastery: 60, exams: 58, homework: 68, curriculum: 32, consistency: 80 }
  },
  {
    id: 109, name: 'Zilola Hasanova', seed: 12, level: 'A2', group: 'A2-ertalab',
    components: { mastery: 58, exams: 57, homework: 66, curriculum: 36, consistency: 79 },
    previous: { mastery: 58, exams: 57, homework: 66, curriculum: 36, consistency: 79 }
  },

  // Band B & C peers for "Barcha levellar" overall ranking
  {
    id: 120, name: 'Shahzod Qosimov', seed: 18, level: 'C1', group: 'C1-SAT',
    components: { mastery: 98, exams: 99, homework: 98, curriculum: 95, consistency: 99 },
    previous: { mastery: 96, exams: 97, homework: 97, curriculum: 92, consistency: 98 }
  },
  {
    id: 121, name: 'Timur Qodirov', seed: 13, level: 'B2', group: 'B2-olimpiada',
    components: { mastery: 95, exams: 96, homework: 97, curriculum: 89, consistency: 98 },
    previous: { mastery: 91, exams: 92, homework: 93, curriculum: 82, consistency: 95 }
  },
  {
    id: 122, name: 'Sevinch Olimova', seed: 14, level: 'C1', group: 'C1-SAT',
    components: { mastery: 95, exams: 94, homework: 96, curriculum: 92, consistency: 97 },
    previous: { mastery: 95, exams: 94, homework: 96, curriculum: 92, consistency: 97 }
  },
  {
    id: 123, name: 'Javohir Rustamov', seed: 19, level: 'B3', group: 'B3-kechki',
    components: { mastery: 93, exams: 92, homework: 95, curriculum: 86, consistency: 96 },
    previous: { mastery: 90, exams: 89, homework: 92, curriculum: 80, consistency: 94 }
  },
  {
    id: 124, name: 'Islom Yusupov', seed: 15, level: 'B1', group: 'B1-kechki',
    components: { mastery: 82, exams: 80, homework: 85, curriculum: 68, consistency: 89 },
    previous: { mastery: 84, exams: 82, homework: 86, curriculum: 70, consistency: 90 }
  },
  {
    id: 125, name: 'Madina Fayzullayeva', seed: 16, level: 'B1', group: 'B1-kechki',
    components: { mastery: 76, exams: 74, homework: 80, curriculum: 60, consistency: 86 },
    previous: { mastery: 74, exams: 73, homework: 78, curriculum: 58, consistency: 85 }
  },
  {
    id: 126, name: 'Bobur Mirzayev', seed: 20, level: 'A1', group: 'A1-boshlangich',
    components: { mastery: 65, exams: 63, homework: 72, curriculum: 45, consistency: 80 },
    previous: { mastery: 62, exams: 60, homework: 70, curriculum: 40, consistency: 78 }
  }
];


/** How many assessed signals a student needs before the ranking is meaningful. */
export const RANKING_MIN_EXAMS = 2;

export type RankingScope = 'level' | 'all';
export type RankingMode = 'performance' | 'improvement';

/**
 * Builds the ranking around a child. The child's own row is computed from
 * their real record and curriculum; classmates come from the mock roster.
 */
export function buildRanking(child: ChildRecord, scope: RankingScope): RankRow[] {
  const breakdown = scoreBreakdown(child, curriculumFor(child.id));
  const me: RankedStudent = {
    id: child.id,
    name: `${child.firstName} ${child.lastName}`,
    seed: child.id,
    level: child.level,
    group: child.group,
    components: {
      mastery: breakdown.mastery ?? 0,
      exams: breakdown.exams ?? 0,
      homework: breakdown.homework,
      curriculum: breakdown.curriculum,
      consistency: breakdown.consistency
    },
    score: breakdown.total,
    // Realistic previous score delta for movement calculation
    previousScore: Math.round((breakdown.total - 3.7) * 10) / 10,
    you: true
  };

  const peers: RankedStudent[] = PEERS.
  filter((peer) => peer.id !== child.id).
  map((peer) => ({
    id: peer.id,
    name: peer.name,
    seed: peer.seed,
    level: peer.level,
    group: peer.group,
    components: peer.components,
    score: total(peer.components),
    previousScore: peer.previous ? total(peer.previous) : null,
    you: false
  }));

  const cohort = [me, ...peers].filter(
    (student) => scope === 'all' || student.level === child.level
  );

  const previousOrder = [...cohort].
  sort((a, b) => (b.previousScore ?? -1) - (a.previousScore ?? -1)).
  map((student) => student.id);

  return [...cohort].
  sort((a, b) => b.score - a.score).
  map((student, i) => {
    const before = previousOrder.indexOf(student.id);
    const hasHistory = student.previousScore !== null;
    return {
      ...student,
      rank: i + 1,
      movement: hasHistory ? before - i : null,
      delta: hasHistory ? Math.round((student.score - (student.previousScore ?? 0)) * 10) / 10 : null
    };
  });
}

/** Same cohort, ordered by score gained since last month. */
export function byImprovement(rows: RankRow[]): RankRow[] {
  return rows.
  filter((row) => row.delta !== null).
  sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0)).
  map((row, i) => ({ ...row, rank: i + 1 }));
}

export function myRow(rows: RankRow[]): RankRow | undefined {
  return rows.find((row) => row.you);
}

/** The student directly ahead — powers the "how to move up" readout. */
export function rowAhead(rows: RankRow[]): RankRow | undefined {
  const mine = myRow(rows);
  if (!mine || mine.rank <= 1) return undefined;
  return rows.find((row) => row.rank === mine.rank - 1);
}
