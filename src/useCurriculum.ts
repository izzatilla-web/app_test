import { useMemo } from 'react';
import { useUI } from './ui';
import { curriculumFor } from './curriculum';
import type { CurriculumLevel } from './curriculum';
import { student } from './mockData';
import { PHOENIX_RUNGS } from './passport';

/**
 * The curriculum, aligned to the rung Phoenix-MS says the student is on.
 *
 * WHY THIS EXISTS: the app's curriculum carries its own `studied` flags, and
 * every "current level" marker on every screen is derived from them — the first
 * unfinished topic wins. Those flags are the app's, not the CRM's, so the goal
 * card announced A2 while the passport beside it announced A3.2 from the same
 * student. One student cannot be on two levels.
 *
 * WHY THE ALIGNMENT IS SOUND: Phoenix-MS moves a student up only when they pass
 * the checkpoint exam at the end of a sub-level (server/db.ts, where the 21
 * rungs are seeded). So a student sitting on A3.2 has genuinely finished A1.1
 * through A3.1 — marking those studied states what the CRM already knows,
 * rather than inventing progress.
 *
 * WHAT IT STILL DOES NOT KNOW: which topics *inside* the current rung are done.
 * The CRM has no per-topic curriculum, so that rung is left exactly as the app
 * describes it, and the first unfinished topic there becomes "current" — which
 * is now the CRM's rung on every screen.
 */
function rungSequence(code: string): number {
  const rung = PHOENIX_RUNGS.find((r) => r.code === code.toUpperCase());
  return rung ? rung.sequence : 0;
}

export function alignCurriculumToRung(
levels: CurriculumLevel[],
rungCode: string | null)
: CurriculumLevel[] {
  const current = rungCode ? rungSequence(rungCode) : 0;
  if (!current) return levels;

  return levels.map((level) => ({
    ...level,
    modules: level.modules.map((module) => {
      const seq = rungSequence(module.code);
      // Modules the CRM's ladder places before the student's rung are passed.
      if (seq > 0 && seq < current) {
        return {
          ...module,
          topics: module.topics.map((topic) =>
          topic.studied ? topic : { ...topic, studied: true }
          )
        };
      }
      // The student's own rung and everything above it stay as they are.
      if (seq >= current) {
        return {
          ...module,
          topics: module.topics.map((topic) =>
          topic.studied && seq > current ? { ...topic, studied: false } : topic
          )
        };
      }
      return module;
    })
  }));
}

/** The curriculum every screen should read, so they all agree on the level. */
export function useCurriculum(): CurriculumLevel[] {
  const ui = useUI();
  const rungCode = ui.activeChild?.student.levelCode ?? null;
  return useMemo(
    () => alignCurriculumToRung(curriculumFor(student.id), rungCode),
    [rungCode]
  );
}
