import { useCallback, useEffect, useState } from 'react';
import { getMyExams } from './services/portalApi';
import type { PortalExam } from './types/portal';

export interface PortalExamsState {
  exams: PortalExam[];
  loading: boolean;
  error: boolean;
  reload: () => void;
}

/**
 * Exam sittings Phoenix-MS lets this family see, newest first as the CRM
 * orders them. `studentId` names WHICH child a parent is asking about; a
 * student login may only ask about themselves. Nothing is fetched until a
 * child is known.
 */
export function usePortalExams(studentId: number | undefined): PortalExamsState {
  const [exams, setExams] = useState<PortalExam[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    if (studentId === undefined) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    getMyExams(studentId).
    then((rows) => {
      if (!cancelled) setExams(rows);
    }).
    catch(() => {
      if (cancelled) return;
      setExams([]);
      setError(true);
    }).
    finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [studentId, attempt]);

  return { exams, loading, error, reload };
}
