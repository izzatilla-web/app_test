import React from 'react';
import { ScrollScreen } from '../components/ScrollScreen';
import { ScreenSkeleton } from '../components/Skeleton';
import { ErrorState } from '../components/ErrorState';
import { AcademicPassportView } from '../components/AcademicPassportView';
import { ExamsSection } from '../components/ProgressSections';
import { t } from '../strings';
import { student } from '../mockData';
import { useUI } from '../ui';

export function StudentProgress({ scrollSignal }: { scrollSignal: number }) {
  const ui = useUI();
  const { dataState } = ui;
  const empty = dataState === 'empty';

  return (
    <ScrollScreen
      title={t.tabProgress}
      subtitle={t.progressSubtitle}
      scrollKey="student-progress"
      scrollToTopSignal={scrollSignal}
      offline={dataState === 'offline'}
    >
      {dataState === 'loading' ? (
        <ScreenSkeleton />
      ) : dataState === 'error' ? (
        <ErrorState onRetry={() => undefined} />
      ) : (
        <div className="space-y-5 pb-16">
          {!empty && <AcademicPassportView child={student} isParent={false} />}
          <ExamsSection exams={empty ? [] : student.exams} />
        </div>
      )}
    </ScrollScreen>
  );
}
