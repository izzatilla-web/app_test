import { FlagIcon } from 'lucide-react';
import { ScrollScreen } from '../components/ScrollScreen';
import { AlertCard } from '../components/Card';
import { Button } from '../components/Button';
import { ScreenSkeleton } from '../components/Skeleton';
import { ErrorState } from '../components/ErrorState';
import { ProgressOverview } from '../components/ProgressOverview';
import { ExamsSection } from '../components/ProgressSections';
import { NewBookingSheet } from './NewBookingSheet';
import { t } from '../strings';
import { student } from '../mockData';
import { useUI } from '../ui';

export function StudentProgress({ scrollSignal }: {scrollSignal: number;}) {
  const ui = useUI();
  const { dataState } = ui;
  const empty = dataState === 'empty';

  return (
    <ScrollScreen
      title={t.tabProgress}
      subtitle={t.progressSubtitle}
      scrollKey="student-progress"
      scrollToTopSignal={scrollSignal}
      offline={dataState === 'offline'}>

      {dataState === 'loading' ?
      <ScreenSkeleton /> :
      dataState === 'error' ?
      <ErrorState onRetry={() => undefined} /> :

      <div className="space-y-8">
          {!empty && student.weakPoints.length > 0 &&
        <section className="px-4">
              <h2 className="mb-2 px-1 font-sans text-section font-semibold uppercase text-mutedfg">
                {t.finishHeader}
              </h2>
              <div className="space-y-3">
                {student.weakPoints.map((wp) =>
            <AlertCard
              key={wp.id}
              tone="amber"
              icon={FlagIcon}
              title={wp.topic}
              action={
              <Button
                variant="secondary"
                full
                onClick={() => {
                  ui.goToTab(4);
                  ui.openSheet({
                    key: 'new-booking',
                    detent: 'large',
                    node:
                    <NewBookingSheet
                      initialPurpose={`${wp.topic} — ${wp.note.toLowerCase()}`} />


                  });
                }}>

                        {t.weakPointCta}
                      </Button>
              }>

                    <p className="mt-1 font-sans text-subhead italic text-foreground/80">
                      «{wp.note}»
                    </p>
                  </AlertCard>
            )}
              </div>
            </section>
        }

          {!empty && <ProgressOverview child={student} />}

          <ExamsSection exams={empty ? [] : student.exams} />
        </div>
      }
    </ScrollScreen>);

}
