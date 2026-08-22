import { useCallback, useEffect, useState } from 'react';
import { getMyLessons } from './services/portalApi';
import type { PortalLesson } from './types/portal';

export interface PortalLessonsState {
  lessons: PortalLesson[];
  loading: boolean;
  error: boolean;
  reload: () => void;
}

/**
 * The register rows Phoenix-MS lets this family see.
 *
 * `studentId` names WHICH child a parent is asking about; a student login may
 * only ask about themselves and the server ignores the parameter. Pass
 * undefined while the portal data is still loading — nothing is fetched until
 * a child is known.
 */
export function usePortalLessons(studentId: number | undefined): PortalLessonsState {
  const [lessons, setLessons] = useState<PortalLesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    if (studentId === undefined) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    getMyLessons(studentId).
    then((rows) => {
      if (cancelled) return;
      setLessons(rows);
    }).
    catch(() => {
      if (cancelled) return;
      setLessons([]);
      setError(true);
    }).
    finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [studentId, attempt]);

  return { lessons, loading, error, reload };
}
