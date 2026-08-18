import React from 'react';
import { LibraryIcon, SlidersHorizontalIcon } from 'lucide-react';
import { ScrollScreen } from '../components/ScrollScreen';
import { CurriculumBrowser } from '../components/CurriculumBrowser';
import { ScreenSkeleton } from '../components/Skeleton';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { NavIconButton } from '../components/NavBar';
import { t } from '../strings';
import { student } from '../mockData';
import { useUI } from '../ui';
import { haptic } from '../tokens';

export function StudentLessons({ scrollSignal }: { scrollSignal: number }) {
  const { dataState, toast } = useUI();
  const empty = dataState === 'empty';

  return (
    <ScrollScreen
      title={t.tabLessons}
      scrollKey="student-lessons"
      scrollToTopSignal={scrollSignal}
      offline={dataState === 'offline'}
      trailing={
        <NavIconButton
          label="Filtr"
          onClick={() => {
            haptic('light');
            toast('Filtrlar: Barcha modullar', 'info');
          }}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200">
            <SlidersHorizontalIcon size={17} strokeWidth={2.2} />
          </div>
        </NavIconButton>
      }
    >
      {dataState === 'loading' ? (
        <ScreenSkeleton />
      ) : dataState === 'error' ? (
        <ErrorState onRetry={() => undefined} />
      ) : empty ? (
        <div className="space-y-3">
          <EmptyState icon={LibraryIcon} title={t.lsEmptyTitle} body={t.lsEmptyBody} />
        </div>
      ) : (
        <div className="space-y-3">
          <CurriculumBrowser child={student} />
        </div>
      )}
    </ScrollScreen>
  );
}
