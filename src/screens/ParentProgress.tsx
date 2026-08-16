import React from 'react';
import { ScrollScreen } from '../components/ScrollScreen';
import { ChildSwitcher } from '../components/ChildSwitcher';
import { ScreenSkeleton } from '../components/Skeleton';
import { ErrorState } from '../components/ErrorState';
import { ProgressOverview } from '../components/ProgressOverview';
import { ExamsSection, SupportSection } from '../components/ProgressSections';
import { t } from '../strings';
import { childById, children } from '../mockData';
import { useUI } from '../ui';

/**
 * Parent progress. Weak points are absent by design — a parent never sees them.
 */
export function ParentProgress({ scrollSignal }: {scrollSignal: number;}) {
  const ui = useUI();
  const { dataState } = ui;
  const child = childById(ui.activeChildId);
  const empty = dataState === 'empty';

  return (
    <ScrollScreen
      title={t.tabProgress}
      scrollKey="parent-progress"
      scrollToTopSignal={scrollSignal}
      offline={dataState === 'offline'}
      belowTitle={
      <ChildSwitcher children={children} activeId={ui.activeChildId} onSelect={ui.setActiveChildId} />
      }>
      
      {dataState === 'loading' ?
      <ScreenSkeleton /> :
      dataState === 'error' ?
      <ErrorState onRetry={() => undefined} /> :

      <div className="space-y-8">
          {!empty && <ProgressOverview child={child} />}
          <ExamsSection exams={empty ? [] : child.exams} />
          {!empty && <SupportSection sessions={child.supportSessions} />}
        </div>
      }
    </ScrollScreen>);

}