import React from 'react';
import { ScrollScreen } from '../components/ScrollScreen';
import { ChildSwitcher } from '../components/ChildSwitcher';
import { ScreenSkeleton } from '../components/Skeleton';
import { ErrorState } from '../components/ErrorState';
import { AcademicPassportView } from '../components/AcademicPassportView';
import { ExamsSection, SupportSection } from '../components/ProgressSections';
import { t } from '../strings';
import { childById } from '../mockData';
import { useUI } from '../ui';
import { usePortalExams } from '../usePortalExams';
import { calculatePassportFromPortal } from '../portalPassport';
import { toAppExam, toAppSupportSession } from '../services/portalAdapters';

/**
 * Parent progress — Academic Forecast & Causes Breakdown.
 * Weak points are absent by design (E12 rule) — parent sees causes & what-if forecasts.
 *
 * Exams and support sessions come from Phoenix-MS. The passport above them is
 * still drawn from the app's own curriculum model (levels → modules → topics,
 * plus the academic goal), which the CRM does not store — see the notes in
 * curriculum.ts. It keeps the mock record until that model has a home in the CRM.
 */
export function ParentProgress({ scrollSignal }: { scrollSignal: number }) {
  const ui = useUI();
  const { dataState } = ui;
  const child = ui.activeChild;
  const empty = dataState === 'empty';
  const exams = usePortalExams(child?.student.id);
  /* Every figure in the passport below is the CRM's own — see portalPassport.ts. */
  const passport = child ?
  calculatePassportFromPortal({
    levelCode: child.student.levelCode,
    topics: child.topics,
    attendanceRate: child.student.attendanceRate,
    attendanceSessions: child.student.attendanceSessions,
    groupName: child.student.groupName,
    exams: exams.exams,
    weakPoints: child.weakPoints
  }) :
  undefined;
  const switcherChildren = (ui.portalChildren ?? []).map((c) => ({
    id: c.student.id,
    firstName: c.student.firstName
  }));

  return (
    <ScrollScreen
      title={t.tabProgress}
      subtitle={t.progressSubtitle}
      scrollKey="parent-progress"
      scrollToTopSignal={scrollSignal}
      offline={dataState === 'offline'}
      belowTitle={
        <ChildSwitcher
          children={switcherChildren}
          activeId={ui.activeChildId}
          onSelect={ui.setActiveChildId}
        />
      }
    >
      {dataState === 'loading' || exams.loading ? (
        <ScreenSkeleton />
      ) : dataState === 'error' || !child ? (
        <ErrorState onRetry={ui.reloadPortal} />
      ) : exams.error ? (
        <ErrorState onRetry={exams.reload} />
      ) : (
        <div className="space-y-5 pb-16">
          {!empty &&
          <AcademicPassportView
            child={childById(ui.activeChildId)}
            isParent={true}
            passport={passport} />
          }
          <ExamsSection exams={empty ? [] : exams.exams.map(toAppExam)} />
          {!empty && <SupportSection sessions={child.sessions.map(toAppSupportSession)} />}
        </div>
      )}
    </ScrollScreen>
  );
}
