import React from 'react';
import { ScrollScreen } from '../components/ScrollScreen';
import { ScreenSkeleton } from '../components/Skeleton';
import { ErrorState } from '../components/ErrorState';
import { AcademicPassportView } from '../components/AcademicPassportView';
import { t } from '../strings';
import { student } from '../mockData';
import { useUI } from '../ui';
import { usePortalExams } from '../usePortalExams';
import { calculatePassportFromPortal } from '../portalPassport';

export function StudentProgress({ scrollSignal }: { scrollSignal: number }) {
  const ui = useUI();
  const { dataState } = ui;
  const empty = dataState === 'empty';
  /* A student login holds exactly one bundle — their own record. */
  const me = ui.activeChild;
  const exams = usePortalExams(me?.student.id);
  /* Every figure in the passport is the CRM's own — see portalPassport.ts. */
  const passport = me ?
  calculatePassportFromPortal({
    levelCode: me.student.levelCode,
    topics: me.topics,
    attendanceRate: me.student.attendanceRate,
    attendanceSessions: me.student.attendanceSessions,
    groupName: me.student.groupName,
    exams: exams.exams,
    weakPoints: me.weakPoints
  }) :
  undefined;

  return (
    <ScrollScreen
      title={t.tabProgress}
      subtitle={t.progressSubtitle}
      scrollKey="student-progress"
      scrollToTopSignal={scrollSignal}
      offline={dataState === 'offline'}
    >
      {dataState === 'loading' || exams.loading ? (
        <ScreenSkeleton />
      ) : dataState === 'error' || !me ? (
        <ErrorState onRetry={ui.reloadPortal} />
      ) : exams.error ? (
        <ErrorState onRetry={exams.reload} />
      ) : (
        <div className="space-y-5 pb-16">
          {/* Exam scores now live inside the goal ladder rows, so the
              separate exams list is gone. */}
          {!empty &&
          <AcademicPassportView child={student} isParent={false} passport={passport} />
          }
        </div>
      )}
    </ScrollScreen>
  );
}
