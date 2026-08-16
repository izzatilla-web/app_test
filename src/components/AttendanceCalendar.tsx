import { useState } from 'react';
import { CalendarOffIcon, FlameIcon, CheckCircle2Icon, ClockIcon, XCircleIcon } from 'lucide-react';
import { CalendarMonth } from './CalendarMonth';
import { LessonSheet } from './LessonList';
import { EmptyState } from './EmptyState';
import { t } from '../strings';
import { haptic, ASSETS_3D } from '../tokens';
import type { Tone } from '../tokens';
import { TODAY } from '../mockData';
import type { ChildRecord, Lesson } from '../mockData';
import { useUI } from '../ui';

/**
 * Attendance Screen — Clean, approachable student attendance tracking.
 */
export function AttendanceCalendar({ child }: { child: ChildRecord }) {
  const ui = useUI();
  const [cursor, setCursor] = useState(() => ({
    year: Number(TODAY.slice(0, 4)),
    month: Number(TODAY.slice(5, 7)) - 1
  }));
  const [selected, setSelected] = useState<string | null>(null);

  const prefix = `${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}`;
  const monthLessons = child.lessons.filter((lesson) => lesson.date.startsWith(prefix));

  const attended = monthLessons.filter((l) => l.present === 'present').length;
  const late = monthLessons.filter((l) => l.present === 'late').length;
  const absent = monthLessons.filter((l) => l.present === 'absent').length;
  const effectiveAttended = attended + late;
  const rate =
    monthLessons.length === 0 ? null : Math.round((effectiveAttended / monthLessons.length) * 100);

  const dots: Record<string, Tone> = {};
  child.lessons.forEach((lesson) => {
    if (lesson.present === 'present') dots[lesson.date] = 'green';
    else if (lesson.present === 'late') dots[lesson.date] = 'amber';
    else if (lesson.present === 'absent') dots[lesson.date] = 'red';
    else dots[lesson.date] = 'grey';
  });

  function step(delta: number) {
    setSelected(null);
    setCursor((prev) => {
      const next = prev.month + delta;
      if (next < 0) return { year: prev.year - 1, month: 11 };
      if (next > 11) return { year: prev.year + 1, month: 0 };
      return { year: prev.year, month: next };
    });
  }

  function selectDay(iso: string) {
    const lesson: Lesson | undefined = child.lessons.find((item) => item.date === iso);
    setSelected(iso);
    if (!lesson) return;
    haptic('light');
    ui.openSheet({
      key: `attendance-${iso}`,
      detent: 'medium',
      node: <LessonSheet lesson={lesson} group={child.group} />
    });
  }

  return (
    <div className="space-y-4 px-4 pb-20">
      {/* Hero Attendance Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 font-sans text-xs font-semibold text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
              <FlameIcon size={12} className="fill-current" />
              14 kunlik streak
            </span>

            <p className="mt-2.5 font-display text-3xl font-bold tabular-nums text-foreground">
              {rate !== null ? `${rate}%` : '—'}
            </p>
            <p className="mt-0.5 font-sans text-xs text-mutedfg">
              Oylik davomat ko'rsatkichi
            </p>

            <p className="mt-3 font-sans text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-foreground">{effectiveAttended}</span>
              {' / '}
              <span>{monthLessons.length} dars qatnashildi</span>
            </p>
          </div>

          {/* 3D Calendar Asset — Transparent PNG */}
          <div className="relative -my-1 -mr-1 flex h-24 w-24 shrink-0 items-center justify-center">
            <img
              src={ASSETS_3D.calendar3d}
              alt="Davomat kalendari"
              className="h-full w-full object-contain drop-shadow-md"
            />
          </div>
        </div>
      </div>

      {/* Calendar Heatmap Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <CalendarMonth
          year={cursor.year}
          month={cursor.month}
          dots={dots}
          todayIso={TODAY}
          selectedIso={selected}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
          onSelectDay={selectDay}
        />

        {/* Legend */}
        <div className="mt-3.5 flex items-center justify-center gap-4 border-t border-hairline pt-3 text-xs text-mutedfg">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Qatnashdi
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Kech qoldi
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Qoldirdi
          </span>
        </div>
      </div>

      {/* Statistics Cards */}
      {monthLessons.length === 0 ? (
        <EmptyState icon={CalendarOffIcon} title={t.lsAttEmpty} compact />
      ) : (
        <div className="grid grid-cols-3 gap-2.5">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <CheckCircle2Icon size={16} className="text-emerald-500" />
            <p className="mt-1 font-sans text-lg font-bold tabular-nums text-foreground">
              {attended}
            </p>
            <p className="font-sans text-[11px] text-mutedfg">
              Qatnashdi
            </p>
          </div>

          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <ClockIcon size={16} className="text-amber-500" />
            <p className="mt-1 font-sans text-lg font-bold tabular-nums text-foreground">
              {late}
            </p>
            <p className="font-sans text-[11px] text-mutedfg">
              Kech qoldi
            </p>
          </div>

          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <XCircleIcon size={16} className="text-red-500" />
            <p className="mt-1 font-sans text-lg font-bold tabular-nums text-foreground">
              {absent}
            </p>
            <p className="font-sans text-[11px] text-mutedfg">
              Qoldirdi
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
