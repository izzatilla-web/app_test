/**
 * Academic calculations over the curriculum.
 *
 * Two rules hold throughout:
 *   1. `null` means "not enough data" and is never silently turned into 0.
 *   2. Nothing is hardcoded — every number is derived from the curriculum and
 *      the child's real assessment/attendance record.
 *
 * Progression and access live in `access.ts`; this file only measures mastery.
 */

import type { AcademicGoal, CurriculumLevel, CurriculumModule, CurriculumTopic } from './curriculum';
import { allModules, allTopics, MASTERY_MASTERED, MASTERY_REVIEW } from './curriculum';
import type { ChildRecord, Lesson } from './mockData';

export { MASTERY_MASTERED, MASTERY_REVIEW };

/* ── Mastery state of a topic ──────────────────────────────────── */

export type MasteryState = 'mastered' | 'in_progress' | 'needs_review' | 'not_started';

export function masteryState(topic: CurriculumTopic): MasteryState {
  if (!topic.studied) return 'not_started';
  if (topic.mastery === null) return 'in_progress';
  if (topic.mastery >= MASTERY_MASTERED) return 'mastered';
  if (topic.mastery < MASTERY_REVIEW) return 'needs_review';
  return 'in_progress';
}

/* ── Mastery bands ─────────────────────────────────────────────── */

export type MasteryBand = 'foundation' | 'developing' | 'strong' | 'mastered';

export function masteryBand(mastery: number): MasteryBand {
  if (mastery >= 90) return 'mastered';
  if (mastery >= MASTERY_MASTERED) return 'strong';
  if (mastery >= 40) return 'developing';
  return 'foundation';
}

/* ── Averages ──────────────────────────────────────────────────── */

/** Mean of the assessed topics only. Null when nothing has been assessed. */
export function averageMastery(topics: CurriculumTopic[]): number | null {
  const scored = topics.filter((topic) => topic.mastery !== null);
  if (scored.length === 0) return null;
  const sum = scored.reduce((total, topic) => total + (topic.mastery ?? 0), 0);
  return Math.round(sum / scored.length);
}

export function moduleMastery(module: CurriculumModule): number | null {
  return averageMastery(module.topics);
}

export function levelMastery(level: CurriculumLevel): number | null {
  return averageMastery(level.modules.flatMap((module) => module.topics));
}

/* ── Curriculum overview ───────────────────────────────────────── */

export interface CurriculumSummary {
  mastered: number;
  inProgress: number;
  needsReview: number;
  notStarted: number;
  total: number;
  /** Topics with at least one assessment behind them. */
  assessed: number;
  /** Mean mastery across assessed topics; null when none assessed. */
  average: number | null;
}

export function summarize(levels: CurriculumLevel[]): CurriculumSummary {
  const topics = allTopics(levels);
  const count = (state: MasteryState) =>
  topics.filter((topic) => masteryState(topic) === state).length;
  return {
    mastered: count('mastered'),
    inProgress: count('in_progress'),
    needsReview: count('needs_review'),
    notStarted: count('not_started'),
    total: topics.length,
    assessed: topics.filter((topic) => topic.mastery !== null).length,
    average: averageMastery(topics)
  };
}

/* ── Readiness towards the goal ────────────────────────────────── */

export type ReadinessStatus = 'strong' | 'on_track' | 'needs_work' | 'unknown';

export interface Readiness {
  percent: number | null;
  status: ReadinessStatus;
  demonstrated: number;
  required: number;
}

/**
 * The share of required topics already demonstrated at the goal's mastery bar.
 * Stays null until at least a third of the curriculum has been assessed — a
 * percentage built on two data points would be fake precision.
 */
export function readiness(levels: CurriculumLevel[], goal: AcademicGoal): Readiness {
  const topics = allTopics(levels);
  const demonstrated = topics.filter(
    (topic) => topic.mastery !== null && topic.mastery >= goal.requiredMastery
  ).length;
  const assessed = topics.filter((topic) => topic.mastery !== null).length;
  const enoughData = topics.length > 0 && assessed / topics.length >= 1 / 3;

  if (!enoughData) {
    return { percent: null, status: 'unknown', demonstrated, required: topics.length };
  }

  const percent = Math.round(demonstrated / topics.length * 100);
  const status: ReadinessStatus =
  percent >= 75 ? 'strong' : percent >= 45 ? 'on_track' : 'needs_work';
  return { percent, status, demonstrated, required: topics.length };
}

/* ── Remaining workload ────────────────────────────────────────── */

export interface RemainingWork {
  topics: number;
  needsReview: number;
  notStarted: number;
  inProgress: number;
  lessonsLow: number;
  lessonsHigh: number;
}

export function remainingWork(levels: CurriculumLevel[]): RemainingWork {
  const topics = allTopics(levels);
  const outstanding = topics.filter((topic) => masteryState(topic) !== 'mastered');
  const planned = outstanding.reduce((total, topic) => total + topic.lessons, 0);
  return {
    topics: outstanding.length,
    needsReview: outstanding.filter((topic) => masteryState(topic) === 'needs_review').length,
    notStarted: outstanding.filter((topic) => masteryState(topic) === 'not_started').length,
    inProgress: outstanding.filter((topic) => masteryState(topic) === 'in_progress').length,
    lessonsLow: Math.round(planned * 0.85),
    lessonsHigh: Math.round(planned * 1.15)
  };
}

/* ── Strengths and weak areas ──────────────────────────────────── */

export interface ModuleMastery {
  module: CurriculumModule;
  mastery: number;
}

/** Assessed modules sorted strongest first. */
export function strongestModules(levels: CurriculumLevel[], limit = 3): ModuleMastery[] {
  return rankedModules(levels).slice(0, limit);
}

/** Assessed modules below the mastered bar, weakest first. */
export function weakestModules(levels: CurriculumLevel[], limit = 3): ModuleMastery[] {
  return rankedModules(levels).
  filter((entry) => entry.mastery < MASTERY_MASTERED).
  reverse().
  slice(0, limit);
}

function rankedModules(levels: CurriculumLevel[]): ModuleMastery[] {
  return allModules(levels).
  map((module) => ({ module, mastery: moduleMastery(module) })).
  filter((entry): entry is ModuleMastery => entry.mastery !== null).
  sort((a, b) => b.mastery - a.mastery);
}

/* ── Recommended next step ─────────────────────────────────────── */

export interface Recommendation {
  topic: CurriculumTopic;
  module: CurriculumModule;
  reason: 'review' | 'continue' | 'next';
  lessons: number;
}

/**
 * Priority order: shaky foundations first, then work already under way, then
 * the next untouched topic in curriculum order.
 */
export function recommendedNext(levels: CurriculumLevel[]): Recommendation | null {
  const pairs = allModules(levels).flatMap((module) =>
  module.topics.map((topic) => ({ topic, module }))
  );

  const byState = (state: MasteryState) =>
  pairs.filter((pair) => masteryState(pair.topic) === state);

  const weakest = byState('needs_review').sort(
    (a, b) => (a.topic.mastery ?? 0) - (b.topic.mastery ?? 0)
  )[0];
  if (weakest) {
    return {
      topic: weakest.topic,
      module: weakest.module,
      reason: 'review',
      lessons: weakest.topic.lessons
    };
  }

  const running = byState('in_progress')[0];
  if (running) {
    return {
      topic: running.topic,
      module: running.module,
      reason: 'continue',
      lessons: running.topic.lessons
    };
  }

  const upcoming = byState('not_started')[0];
  if (upcoming) {
    return {
      topic: upcoming.topic,
      module: upcoming.module,
      reason: 'next',
      lessons: upcoming.topic.lessons
    };
  }
  return null;
}

/* ── Academic performance score (drives the ranking) ───────────── */

/**
 * Weights for the composite academic score. Documented and adjustable rather
 * than buried in the formula — every input already exists in the app.
 */
export const SCORE_WEIGHTS = {
  mastery: 0.35,
  exams: 0.25,
  homework: 0.2,
  curriculum: 0.1,
  consistency: 0.1
};

export interface ScoreBreakdown {
  mastery: number | null;
  exams: number | null;
  homework: number;
  curriculum: number;
  consistency: number;
  total: number;
}

export function scoreBreakdown(child: ChildRecord, levels: CurriculumLevel[]): ScoreBreakdown {
  const mastery = averageMastery(allTopics(levels));
  const exams =
  child.exams.length > 0 ?
  Math.round(child.exams.reduce((sum, exam) => sum + exam.score, 0) / child.exams.length) :
  null;
  const curriculum =
  child.topicsTotal > 0 ? Math.round(child.topicsDone / child.topicsTotal * 100) : 0;

  // Missing components drop out of both the numerator and the weight total, so
  // a student without exams is not silently penalised with a zero.
  const parts: [number | null, number][] = [
  [mastery, SCORE_WEIGHTS.mastery],
  [exams, SCORE_WEIGHTS.exams],
  [child.homeworkRate, SCORE_WEIGHTS.homework],
  [curriculum, SCORE_WEIGHTS.curriculum],
  [child.attendanceRate, SCORE_WEIGHTS.consistency]];

  const available = parts.filter((part): part is [number, number] => part[0] !== null);
  const weight = available.reduce((sum, [, w]) => sum + w, 0);
  const total =
  weight > 0 ? available.reduce((sum, [value, w]) => sum + value * w, 0) / weight : 0;

  return {
    mastery,
    exams,
    homework: child.homeworkRate,
    curriculum,
    consistency: child.attendanceRate,
    total: Math.round(total * 10) / 10
  };
}

/* ── Learning status ───────────────────────────────────────────── */

export type LearningStatus = 'excellent' | 'on_track' | 'needs_attention' | 'unknown';

/**
 * A judgement only when the signals support one: mastery of assessed work,
 * homework and attendance. Otherwise 'unknown', so the UI can say so plainly.
 */
export function learningStatus(child: ChildRecord, summary: CurriculumSummary): LearningStatus {
  if (summary.average === null || summary.assessed < 3) return 'unknown';
  const signals = [summary.average, child.homeworkRate, child.attendanceRate];
  const mean = signals.reduce((sum, value) => sum + value, 0) / signals.length;
  if (mean >= 85 && summary.needsReview === 0) return 'excellent';
  if (mean >= 70) return 'on_track';
  return 'needs_attention';
}

/* ── Performance summaries ─────────────────────────────────────── */

export interface ExamStats {
  average: number;
  latest: number;
  best: number;
  count: number;
}

/** Null when the student has not sat an exam — never a zero average. */
export function examStats(child: ChildRecord): ExamStats | null {
  if (child.exams.length === 0) return null;
  const newestFirst = [...child.exams].sort((a, b) => (a.date < b.date ? 1 : -1));
  return {
    average: Math.round(
      child.exams.reduce((sum, exam) => sum + exam.score, 0) / child.exams.length
    ),
    latest: newestFirst[0].score,
    best: Math.max(...child.exams.map((exam) => exam.score)),
    count: child.exams.length
  };
}

/* ── Learning activity over time ───────────────────────────────── */

export interface ActivityWeek {
  /** ISO date of the Monday starting the week. */
  start: string;
  total: number;
  attended: number;
}

function weekStart(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Attended vs scheduled classes per week, oldest first.
 *
 * The lesson record is a recent window rather than the whole term, so this
 * answers "am I studying consistently lately?". Callers must handle a result
 * with fewer than two weeks by showing "not enough data" — a single bar is not
 * a trend, and the app stores no longer history to fill one in.
 */
export function weeklyActivity(lessons: Lesson[], weeks = 6): ActivityWeek[] {
  const buckets = new Map<string, ActivityWeek>();
  lessons.forEach((lesson) => {
    const start = weekStart(lesson.date);
    const bucket = buckets.get(start) ?? { start, total: 0, attended: 0 };
    bucket.total += 1;
    if (lesson.present === 'present' || lesson.present === 'late') bucket.attended += 1;
    buckets.set(start, bucket);
  });
  return [...buckets.values()].sort((a, b) => (a.start < b.start ? -1 : 1)).slice(-weeks);
}

/* ── Recent activity feed ──────────────────────────────────────── */

export type ActivityKind = 'attended' | 'missed' | 'homework' | 'exam';

export interface ActivityItem {
  kind: ActivityKind;
  date: string;
  /** Extra detail already present in the record, e.g. an exam score. */
  detail: string | null;
}

/**
 * The newest real event of each kind, newest first — nothing generated.
 *
 * Deliberately one per kind: a raw chronological feed would be a wall of
 * "attended a class" and tell the reader nothing they cannot see in Attendance.
 */
export function recentActivity(child: ChildRecord, limit = 3): ActivityItem[] {
  const events: ActivityItem[] = [];

  child.lessons.forEach((lesson) => {
    if (lesson.present === 'absent') {
      events.push({ kind: 'missed', date: lesson.date, detail: null });
    } else if (lesson.present === 'present' || lesson.present === 'late') {
      events.push({ kind: 'attended', date: lesson.date, detail: null });
    }
    if (lesson.homework === 'done') {
      events.push({ kind: 'homework', date: lesson.date, detail: null });
    }
  });

  child.exams.forEach((exam) => {
    events.push({ kind: 'exam', date: exam.date, detail: `${exam.score}` });
  });

  const newestFirst = events.sort((a, b) => (a.date < b.date ? 1 : -1));
  const seen = new Set<ActivityKind>();
  return newestFirst.
  filter((event) => {
    if (seen.has(event.kind)) return false;
    seen.add(event.kind);
    return true;
  }).
  slice(0, limit);
}

/* ── Watched videos ────────────────────────────────────────────── */

export interface WatchedStats {
  count: number;
  seconds: number;
}

/** How much recorded material the student has actually watched. */
export function watchedVideos(levels: CurriculumLevel[]): WatchedStats {
  const watched = allTopics(levels).
  flatMap((topic) => topic.content.videos).
  filter((video) => video.watched);
  return {
    count: watched.length,
    seconds: watched.reduce((sum, video) => sum + video.seconds, 0)
  };
}
