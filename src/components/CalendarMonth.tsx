import { useRef, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { toneFg, haptic } from '../tokens';
import { t } from '../strings';
import type { Tone } from '../tokens';

interface CalendarMonthProps {
  year: number;
  month: number; // 0-based
  dots: Record<string, Tone>; // "2026-08-11" -> tone
  todayIso?: string;
  selectedIso?: string | null;
  onPrev: () => void;
  onNext: () => void;
  onSelectDay: (iso: string) => void;
}

function iso(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const SWIPE_THRESHOLD = 48;

export function CalendarMonth({
  year,
  month,
  dots,
  todayIso,
  selectedIso,
  onPrev,
  onNext,
  onSelectDay
}: CalendarMonthProps) {
  const [direction, setDirection] = useState<'next' | 'prev' | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);

  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ];

  function go(way: 'next' | 'prev') {
    haptic('light');
    setDirection(way);
    if (way === 'next') onNext();
    else onPrev();
  }

  function onPointerDown(e: React.PointerEvent) {
    start.current = { x: e.clientX, y: e.clientY };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (start.current === null) return;
    if (Math.abs(e.clientX - start.current.x) > 8) e.stopPropagation();
  }
  function onPointerUp(e: React.PointerEvent) {
    const from = start.current;
    start.current = null;
    if (from === null) return;
    const dx = e.clientX - from.x;
    const dy = e.clientY - from.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    e.stopPropagation();
    go(dx < 0 ? 'next' : 'prev');
  }

  return (
    <div>
      {/* Month Navigation */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => go('prev')}
          aria-label="Oldingi oy"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-all hover:bg-slate-200 active:scale-95 dark:bg-slate-800 dark:text-slate-200"
        >
          <ChevronLeftIcon size={18} strokeWidth={2.4} />
        </button>
        <span className="font-display text-lg font-bold text-slate-900 dark:text-white">
          {t.monthsFull[month]} {year}
        </span>
        <button
          type="button"
          onClick={() => go('next')}
          aria-label="Keyingi oy"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-all hover:bg-slate-200 active:scale-95 dark:bg-slate-800 dark:text-slate-200"
        >
          <ChevronRightIcon size={18} strokeWidth={2.4} />
        </button>
      </div>

      <div
        className="touch-pan-y select-none overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          start.current = null;
        }}
      >
        <div
          key={`${year}-${month}`}
          className={
            direction === 'next'
              ? 'month-in-next'
              : direction === 'prev'
              ? 'month-in-prev'
              : undefined
          }
        >
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-y-1">
            {t.weekdaysShort.map((d) => (
              <div
                key={d}
                className="pb-2 text-center font-sans text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
              >
                {d}
              </div>
            ))}

            {/* Day cells */}
            {cells.map((day, i) => {
              if (day === null) return <div key={`e${i}`} className="h-11" />;
              const date = iso(year, month, day);
              const tone = dots[date];
              const isToday = date === todayIso;
              const isSelected = date === selectedIso;

              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => onSelectDay(date)}
                  className="flex h-11 flex-col items-center justify-center transition-transform duration-100 ease-out active:scale-90"
                >
                  <span
                    className={[
                      'flex h-7 w-7 items-center justify-center rounded-full font-sans text-xs font-semibold tabular-nums transition-all',
                      isToday
                        ? 'bg-blue-600 font-bold text-white shadow-sm ring-2 ring-blue-200 dark:ring-blue-900'
                        : isSelected
                        ? 'bg-purple-100 font-bold text-purple-700 ring-2 ring-purple-400 dark:bg-purple-950 dark:text-purple-300'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                    ].join(' ')}
                  >
                    {day}
                  </span>
                  <span
                    className="mt-1 h-1.5 w-1.5 rounded-full transition-colors"
                    style={{ backgroundColor: tone ? toneFg(tone) : 'transparent' }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
