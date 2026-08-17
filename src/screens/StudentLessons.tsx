import { useState } from 'react';
import { LibraryIcon, SlidersHorizontalIcon } from 'lucide-react';
import { ScrollScreen } from '../components/ScrollScreen';
import { SegmentedControl } from '../components/SegmentedControl';
import { CurriculumBrowser } from '../components/CurriculumBrowser';
import { AttendanceCalendar } from '../components/AttendanceCalendar';
import { PracticePlan } from '../components/PracticePlan';
import { ScreenSkeleton } from '../components/Skeleton';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { NavIconButton } from '../components/NavBar';
import { t } from '../strings';
import { curriculumProgress, currentPosition } from '../access';
import { curriculumFor } from '../curriculum';
import { student } from '../mockData';
import { useUI } from '../ui';
import { haptic } from '../tokens';

export function StudentLessons({ scrollSignal }: {scrollSignal: number;}) {
  const { dataState, toast } = useUI();
  const [tab, setTab] = useState(0);

  const empty = dataState === 'empty';
  const levels = curriculumFor(student.id);
  const position = currentPosition(levels);
  const progress = curriculumProgress(levels);

  return (
    <ScrollScreen
      title={t.tabLessons}
      subtitle={
        position ?
        `${position.level.code} · ${position.level.title}` :
        t.lessonsSubtitle
      }
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
      belowTitle={
        <div className="space-y-2 px-4 pb-2 pt-2">
          <SegmentedControl
            options={[t.lsSegCurriculum, t.lsSegAttendance]}
            value={tab}
            onChange={setTab}
          />

          {tab === 0 && !empty && (
            <p className="px-1 font-sans text-footnote font-medium tabular-nums text-mutedfg">
              {t.lsCompletedOf(progress.done, progress.total)}
            </p>
          )}
        </div>
      }>

      {dataState === 'loading' ?
      <ScreenSkeleton /> :
      dataState === 'error' ?
      <ErrorState onRetry={() => undefined} /> :
      tab === 0 ?

      <div className="space-y-8">
          {empty ?
        <EmptyState icon={LibraryIcon} title={t.lsEmptyTitle} body={t.lsEmptyBody} /> :

        <>
              <CurriculumBrowser child={student} />
              <PracticePlan child={student} />
            </>
        }
        </div> :


      <AttendanceCalendar child={student} />
      }
    </ScrollScreen>);

}
