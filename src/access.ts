/**
 * Curriculum progression and access control.
 *
 * This module is the single authority on what a student may open. Every screen
 * asks `canOpenTopic` rather than comparing indexes inline, so there is exactly
 * one place to swap in a server check.
 *
 * ⚠ FRONTEND ENFORCEMENT ONLY.
 * This project has no backend — there is no API, database or auth service, and
 * all data comes from `mockData.ts`. Locking here therefore reflects
 * authorization, it does not enforce it. Before this ships, the server must
 * apply the same rules when serving topic content, video URLs, homework and
 * exams; otherwise a crafted request still reaches locked material. The rules
 * below are written as one pure function precisely so the backend can mirror
 * them exactly.
 *
 * PROGRESSION RULES
 *   1. Topics unlock sequentially in curriculum order.
 *   2. A topic is completed once it has been taught and finished (`studied`).
 *   3. The current topic is the first topic that is not yet completed.
 *   4. Completed topics stay open for review; everything after the current
 *      topic is locked.
 *   5. A module/level is completed when all of its topics are; it is current
 *      when it contains the current topic; locked when it lies beyond it.
 *   6. Module exams are surfaced, not used as a gate — the centre has no
 *      documented retake-blocks-progression policy, so inventing one here
 *      would be inventing business logic.
 */

import { allTopics } from './curriculum';
import type { CurriculumLevel, CurriculumModule, CurriculumTopic } from './curriculum';
import type { ChildRecord, Exam } from './mockData';

export type ItemState = 'completed' | 'current' | 'available' | 'locked';

export interface Position {
  level: CurriculumLevel;
  module: CurriculumModule;
  topic: CurriculumTopic;
}

/** Where the student is right now, or null when the curriculum is finished. */
export function currentPosition(levels: CurriculumLevel[]): Position | null {
  for (const level of levels) {
    for (const module of level.modules) {
      for (const topic of module.topics) {
        if (!topic.studied) return { level, module, topic };
      }
    }
  }
  return null;
}

export function topicAccess(levels: CurriculumLevel[], topic: CurriculumTopic): ItemState {
  if (topic.studied) return 'completed';
  const position = currentPosition(levels);
  return position && position.topic.id === topic.id ? 'current' : 'locked';
}

export function moduleAccess(levels: CurriculumLevel[], module: CurriculumModule): ItemState {
  if (module.topics.length === 0) return 'locked';
  if (module.topics.every((topic) => topic.studied)) return 'completed';
  const position = currentPosition(levels);
  if (position && module.topics.some((topic) => topic.id === position.topic.id)) return 'current';
  // Some topics are done but the current pointer is elsewhere — partially open.
  return module.topics.some((topic) => topic.studied) ? 'available' : 'locked';
}

export function levelAccess(levels: CurriculumLevel[], level: CurriculumLevel): ItemState {
  const topics = level.modules.flatMap((module) => module.topics);
  if (topics.length === 0) return 'locked';
  if (topics.every((topic) => topic.studied)) return 'completed';
  const position = currentPosition(levels);
  if (position && topics.some((topic) => topic.id === position.topic.id)) return 'current';
  return topics.some((topic) => topic.studied) ? 'available' : 'locked';
}

/**
 * The one gate. Call this before rendering or navigating to any topic content;
 * never compare indexes at the call site.
 */
export function canOpenTopic(levels: CurriculumLevel[], topicId: number): boolean {
  const topic = allTopics(levels).find((item) => item.id === topicId);
  if (!topic) return false;
  return topicAccess(levels, topic) !== 'locked';
}

/* ── Progress counters ─────────────────────────────────────────── */

export interface ProgressCount {
  done: number;
  total: number;
  /** 0–100, rounded. 0 when the module is empty. */
  percent: number;
}

function count(topics: CurriculumTopic[]): ProgressCount {
  const done = topics.filter((topic) => topic.studied).length;
  const total = topics.length;
  return { done, total, percent: total === 0 ? 0 : Math.round(done / total * 100) };
}

export function moduleProgress(module: CurriculumModule): ProgressCount {
  return count(module.topics);
}

export function levelProgress(level: CurriculumLevel): ProgressCount {
  return count(level.modules.flatMap((module) => module.topics));
}

export function curriculumProgress(levels: CurriculumLevel[]): ProgressCount {
  return count(allTopics(levels));
}

/* ── Exams ─────────────────────────────────────────────────────── */

/**
 * Uzbek content mixes ʻ / ‘ / ’ / ' for the same apostrophe, so a raw string
 * comparison silently loses matches. Normalise before comparing titles.
 */
function normalizeTitle(value: string): string {
  return value.replace(/[‘’ʻʼ`']/g, "'").trim().toLocaleLowerCase();
}

/**
 * The module's exam, read from the child's real exam records. Returns null when
 * the module has no exam or the student has not sat it yet — never a made-up
 * score, and never a locally invented pass mark: `Exam.result` already carries
 * the centre's grading decision.
 *
 * Matching by title is a stopgap; a real backend should expose an exam id on
 * the module so this never depends on text at all.
 */
export function moduleExam(module: CurriculumModule, child: ChildRecord): Exam | null {
  if (module.examTopic === null) return null;
  const wanted = normalizeTitle(module.examTopic);
  return child.exams.find((exam) => normalizeTitle(exam.topic) === wanted) ?? null;
}

/** What the student must finish before the next module opens. */
export function blockingTopics(module: CurriculumModule): CurriculumTopic[] {
  return module.topics.filter((topic) => !topic.studied);
}
