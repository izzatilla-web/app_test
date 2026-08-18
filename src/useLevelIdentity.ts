import { useMemo } from 'react';
import { useUI } from './ui';
import { student } from './mockData';
import { curriculumFor } from './curriculum';
import { currentPosition, levelProgress } from './access';
import {
  nextLevelMeta,
  resolveLevelMeta,
  type AcademicLevelCode,
  type LevelMeta
} from './types/levelIdentity';

export interface LevelIdentityState {
  meta: LevelMeta;
  next: LevelMeta | null;
  /**
   * Real topic progress (0–100) inside the displayed level, derived from the
   * student's curriculum. Null when the level is absent from their curriculum —
   * callers hide the number instead of inventing one.
   */
  percent: number | null;
  /** Topics still open inside the displayed level; null when unknown. */
  remainingTopics: number | null;
}

/** The student's level identity + real curriculum progress inside it. */
export function useLevelIdentity(): LevelIdentityState {
  const ui = useUI();
  const curriculumLevels = curriculumFor(student.id);
  const activePositionLevel = (currentPosition(curriculumLevels)?.level.code as AcademicLevelCode) || 'A2';

  // If the assigned/stored level is already completed (100%), advance to the active level
  let code = (ui.studentLevel || activePositionLevel || student.level || 'A2') as AcademicLevelCode;
  const currentLvl = curriculumLevels.find((entry) => entry.code === code);
  if (currentLvl && levelProgress(currentLvl).percent === 100 && activePositionLevel) {
    code = activePositionLevel;
  }

  return useMemo(() => {
    const meta = resolveLevelMeta(code);
    const next = nextLevelMeta(meta);
    const level = curriculumLevels.find((entry) => entry.code === meta.code);
    if (!level) return { meta, next, percent: null, remainingTopics: null };
    const progress = levelProgress(level);
    return {
      meta,
      next,
      percent: progress.percent,
      remainingTopics: progress.total - progress.done
    };
  }, [code, curriculumLevels]);
}
