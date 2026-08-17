import React from 'react';
import { ScrollScreen } from '../components/ScrollScreen';
import { ChildSwitcher } from '../components/ChildSwitcher';
import { ScreenSkeleton } from '../components/Skeleton';
import { ErrorState } from '../components/ErrorState';
import { AcademicPassportView } from '../components/AcademicPassportView';
import { ExamsSection, SupportSection } from '../components/ProgressSections';
import { t } from '../strings';
import { childById, children } from '../mockData';
import { useUI } from '../ui';

/**
 * Parent progress — Academic Forecast & Causes Breakdown.
 * Weak points are absent by design (E12 rule) — parent sees causes & what-if forecasts.
 */
export function ParentProgress({ scrollSignal }: { scrollSignal: number }) {
  const ui = useUI();
  const { dataState } = ui;
  const child = childById(ui.activeChildId);
  const empty = dataState === 'empty';

  return (
    <ScrollScreen
      title={t.tabProgress}
      subtitle={t.progressSubtitle}
      scrollKey="parent-progress"
      scrollToTopSignal={scrollSignal}
      offline={dataState === 'offline'}
      belowTitle={
        <ChildSwitcher
          children={children}
          activeId={ui.activeChildId}
          onSelect={ui.setActiveChildId}
        />
      }
    >
      {dataState === 'loading' ? (
        <ScreenSkeleton />
      ) : dataState === 'error' ? (
        <ErrorState onRetry={() => undefined} />
      ) : (
        <div className="space-y-5 pb-16">
          {!empty && <AcademicPassportView child={child} isParent={true} />}
          <ExamsSection exams={empty ? [] : child.exams} />
          {!empty && <SupportSection sessions={child.supportSessions} />}
        </div>
      )}
    </ScrollScreen>
  );
}