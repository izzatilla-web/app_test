import React, { useState } from 'react';
import { ScrollScreen } from '../components/ScrollScreen';
import { ChildSwitcher } from '../components/ChildSwitcher';
import { CalendarMonth } from '../components/CalendarMonth';
import { LessonList } from '../components/LessonList';
import { ScreenSkeleton } from '../components/Skeleton';
import { ErrorState } from '../components/ErrorState';
import { t } from '../strings';
import { toneFg, haptic, ASSETS_3D } from '../tokens';
import type { Tone } from '../tokens';
import { TODAY } from '../mockData';
import { useUI } from '../ui';
import { usePortalLessons } from '../usePortalLessons';
import { homeworkRateOf, toAppLesson } from '../services/portalAdapters';

export function ParentAttendance({ scrollSignal }: { scrollSignal: number }) {
  const ui = useUI();
  const { dataState } = ui;
  const child = ui.activeChild;
  const [month, setMonth] = useState({ year: 2026, month: 7 });
  const [selected, setSelected] = useState<string | null>(null);

  /* Register rows for the selected child, straight from Phoenix-MS. */
  const register = usePortalLessons(child?.student.id);
  const lessons = dataState === 'empty' ? [] : register.lessons.map(toAppLesson);
  const homeworkRate = homeworkRateOf(register.lessons);
  const switcherChildren = (ui.portalChildren ?? []).map((c) => ({
    id: c.student.id,
    firstName: c.student.firstName
  }));

  /* One dot per day. Phoenix-MS can mark two lessons on the same date, so the
     worst mark wins — an absence must never hide behind a later "present". */
  const dotRank: Record<string, number> = { green: 0, amber: 1, red: 2 };
  const dots: Record<string, Tone> = {};
  lessons.forEach((lesson) => {
    const tone: Tone | null =
    lesson.present === 'present' ? 'green' :
    lesson.present === 'late' ? 'amber' :
    lesson.present === 'absent' ? 'red' :
    null;
    if (!tone) return;
    const current = dots[lesson.date];
    if (!current || dotRank[tone] > dotRank[current]) dots[lesson.date] = tone;
  });

  function selectDay(iso: string) {
    haptic('light');
    setSelected(iso);
    window.setTimeout(() => {
      document.getElementById(`lesson-${iso}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 30);
    window.setTimeout(() => setSelected(null), 2200);
  }

  function shift(delta: number) {
    setMonth((m) => {
      const next = m.month + delta;
      if (next < 0) return { year: m.year - 1, month: 11 };
      if (next > 11) return { year: m.year + 1, month: 0 };
      return { ...m, month: next };
    });
  }

  return (
    <ScrollScreen
      title={t.tabAttendance}
      scrollKey="parent-attendance"
      scrollToTopSignal={scrollSignal}
      offline={dataState === 'offline'}
      belowTitle={
        <div className="px-4 pb-2 pt-1">
          <ChildSwitcher
            children={switcherChildren}
            activeId={ui.activeChildId}
            onSelect={ui.setActiveChildId} />
        </div>
      }
    >
      {dataState === 'loading' || register.loading ? (
        <ScreenSkeleton />
      ) : dataState === 'error' ? (
        <ErrorState onRetry={ui.reloadPortal} />
      ) : register.error || !child ? (
        <ErrorState onRetry={register.reload} />
      ) : (
        <div className="space-y-4 px-4 pb-20">
          {/* Top Hero Summary with 3D Calendar */}
          <div className="relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="min-w-0 flex-1">
              <p className="font-sans text-xs text-mutedfg">
                Umumiy davomat
              </p>
              <p className="mt-1 font-display text-3xl font-bold tabular-nums text-foreground">
                {child.student.attendanceRate ?? 0}%
              </p>
              <div className="mt-2 flex items-center gap-2 font-sans text-xs text-mutedfg">
                <span>{child.student.attendanceSessions} ta dars o'tildi</span>
                {homeworkRate !== null &&
                <>
                    <span>·</span>
                    <span>{homeworkRate}% vazifalar</span>
                  </>
                }
              </div>
            </div>

            <div className="relative -my-1 -mr-1 flex h-20 w-20 shrink-0 items-center justify-center">
              <img
                src={ASSETS_3D.calendar3d}
                alt="Davomat"
                className="h-full w-full object-contain drop-shadow-md"
              />
            </div>
          </div>

          {/* Calendar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <CalendarMonth
              year={month.year}
              month={month.month}
              dots={dots}
              todayIso={TODAY}
              selectedIso={selected}
              onPrev={() => shift(-1)}
              onNext={() => shift(1)}
              onSelectDay={selectDay}
            />

            <div className="mt-3.5 flex items-center justify-center gap-4 border-t border-hairline pt-3">
              {(
                [
                  ['green', t.legendPresent],
                  ['amber', t.legendLate],
                  ['red', t.legendAbsent]
                ] as [Tone, string][]
              ).map(([tone, label]) => (
                <span key={label} className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: toneFg(tone) }}
                  />
                  <span className="font-sans text-xs font-medium text-slate-500 dark:text-slate-400">
                    {label}
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Lessons list */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-hairline bg-slate-50/60 px-4 py-2.5 dark:bg-slate-900/60">
              <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Darslar tarixi
              </h3>
            </div>
            <LessonList
              lessons={lessons}
              group={child.student.groupName ?? ''}
              highlightDate={selected} />
          </div>
        </div>
      )}
    </ScrollScreen>
  );
}