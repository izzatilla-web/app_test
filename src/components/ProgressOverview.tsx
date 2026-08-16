import { useMemo, useState } from 'react';
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronDownIcon,
  LockIcon,
  TrendingUpIcon,
  AwardIcon
} from 'lucide-react';
import { t } from '../strings';
import { haptic, mediumDate, shortDate, ASSETS_3D } from '../tokens';
import {
  examStats,
  readiness,
  recentActivity,
  strongestModules,
  watchedVideos,
  weakestModules,
  weeklyActivity
} from '../academics';
import type { ActivityItem, ModuleMastery } from '../academics';
import {
  currentPosition,
  curriculumProgress,
  levelAccess,
  levelProgress,
  moduleAccess,
  moduleProgress
} from '../access';
import { curriculumFor, goalFor } from '../curriculum';
import type { CurriculumLevel } from '../curriculum';
import type { ChildRecord } from '../mockData';
import { useUI } from '../ui';

/**
 * Progress Screen — Academic progress map:
 * 1. Progress Hero Card with transparent 3D asset
 * 2. Target Goal Road: A2 ➔ B1
 * 3. Keyingi dars (Next step)
 * 4. Kuchli mavzular & Rivojlantirish kerak
 * 5. Metrics & Activity history
 */
export function ProgressOverview({ child }: { child: ChildRecord }) {
  const levels = useMemo(() => curriculumFor(child.id), [child.id]);
  const goal = goalFor(child.id);
  const overall = useMemo(() => curriculumProgress(levels), [levels]);
  const ready = useMemo(() => readiness(levels, goal), [levels, goal]);
  const position = useMemo(() => currentPosition(levels), [levels]);
  const exams = useMemo(() => examStats(child), [child]);
  const strong = useMemo(() => strongestModules(levels, 3), [levels]);
  const weak = useMemo(() => weakestModules(levels, 2), [levels]);
  const activity = useMemo(() => recentActivity(child, 4), [child]);
  const weeks = useMemo(() => weeklyActivity(child.lessons), [child.lessons]);
  const watched = useMemo(() => watchedVideos(levels), [levels]);

  return (
    <div className="space-y-5 px-4 pb-20">
      {/* 1. Progress Hero Card */}
      <div
        className="relative overflow-hidden rounded-2xl p-5 text-white shadow-sm"
        style={{
          background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 55%, #3B82F6 100%)'
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <span className="font-sans text-xs font-semibold text-blue-200">
              {child.firstName} · {child.level}
            </span>

            <p className="mt-2 font-display text-3xl font-bold tabular-nums leading-none text-white">
              {overall.percent}%
            </p>
            <p className="mt-1 font-sans text-xs font-medium text-blue-100">
              Umumiy o'zlashtirish
            </p>

            <div className="mt-4">
              <div className="h-1.5 w-full max-w-[200px] overflow-hidden rounded-full bg-white/20">
                <div
                  className="bar-fill h-full rounded-full bg-white"
                  style={{ width: `${overall.percent}%` }}
                />
              </div>
              <p className="mt-2 font-sans text-xs text-blue-100">
                {overall.done} / {overall.total} mavzu o'zlashtirildi
              </p>
            </div>
          </div>

          {/* 3D Learning Diploma / Passport — Transparent PNG */}
          <div className="relative -my-1 -mr-1 flex h-24 w-24 shrink-0 items-center justify-center">
            <img
              src={ASSETS_3D.passport3d}
              alt="Progress"
              className="h-full w-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.25)]"
            />
          </div>
        </div>
      </div>

      {/* 2. Target Goal Road */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-hairline pb-3">
          <div>
            <p className="font-sans text-xs text-mutedfg">Joriy daraja</p>
            <p className="mt-0.5 font-sans text-base font-bold text-foreground">
              {position ? position.level.code : child.level}
            </p>
          </div>

          <div className="text-right">
            <p className="font-sans text-xs text-mutedfg">Maqsad</p>
            <p className="mt-0.5 font-sans text-base font-bold text-blue-600 dark:text-blue-400">
              {goal.targetLevel}
            </p>
          </div>
        </div>

        {/* Milestone Steps */}
        <div className="mt-4 flex items-center justify-between">
          {[
            ...levels.map((level) => ({ code: level.code, state: levelAccess(levels, level) })),
            { code: goal.targetLevel, state: 'target' as const }
          ].map((stop, i, arr) => (
            <div key={stop.code} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center">
                <span
                  className={[
                    'flex h-8 w-8 items-center justify-center rounded-full font-sans text-xs font-bold',
                    stop.state === 'completed'
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                      : stop.state === 'current'
                      ? 'bg-blue-600 text-white ring-2 ring-blue-100 dark:ring-blue-900'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                  ].join(' ')}
                >
                  {stop.state === 'completed' ? <CheckIcon size={13} strokeWidth={3.5} /> : stop.code}
                </span>
                <span className="mt-1 font-sans text-[10px] font-medium text-mutedfg">{stop.code}</span>
              </div>

              {i < arr.length - 1 && (
                <div
                  className={[
                    'mx-2 h-1 flex-1 rounded-full',
                    stop.state === 'completed'
                      ? 'bg-blue-600'
                      : 'bg-slate-100 dark:bg-slate-800'
                  ].join(' ')}
                />
              )}
            </div>
          ))}
        </div>

        {ready.percent !== null && (
          <div className="mt-3.5 flex items-center justify-between rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60">
            <span className="font-sans text-xs font-medium text-slate-700 dark:text-slate-300">
              Maqsadga tayyorgarlik
            </span>
            <span className="font-sans text-xs font-bold text-blue-600 dark:text-blue-400">
              {ready.percent}%
            </span>
          </div>
        )}
      </div>

      {/* 3. Next Action */}
      {position && <NextActionCard position={position} />}

      {/* 4. Strengths & Focus Areas */}
      <Focus strong={strong} weak={weak} />

      {/* 5. Metrics & Activity */}
      <Metrics child={child} overall={overall} exams={exams} />
      <Activity child={child} watched={watched} weeks={weeks} />
      {activity.length > 0 && <Recent items={activity} />}

      {/* 6. Levels Breakdown */}
      <Levels levels={levels} openLevelId={position?.level.id ?? null} />
    </div>
  );
}

function NextActionCard({
  position
}: {
  position: NonNullable<ReturnType<typeof currentPosition>>;
}) {
  const ui = useUI();
  const progress = moduleProgress(position.module);

  return (
    <div className="rounded-2xl border border-blue-500/30 bg-blue-50/50 p-4 dark:bg-blue-950/20 shadow-sm">
      <p className="font-sans text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
        Keyingi dars
      </p>

      <h3 className="mt-1 font-sans text-base font-bold text-foreground">
        {position.module.title}
      </h3>
      <p className="mt-0.5 font-sans text-xs text-mutedfg">
        {position.topic.title}
      </p>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className="bar-fill h-full rounded-full bg-blue-600"
          style={{ width: `${progress.percent}%` }}
        />
      </div>

      <button
        type="button"
        onClick={() => {
          haptic('light');
          ui.goToTab(3);
        }}
        className="mt-3.5 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 font-sans text-xs font-bold text-white shadow-sm transition-transform active:scale-[0.98] hover:bg-blue-700"
      >
        Davom etish
        <ArrowRightIcon size={14} />
      </button>
    </div>
  );
}

function Focus({ strong, weak }: { strong: ModuleMastery[]; weak: ModuleMastery[] }) {
  return (
    <div className="space-y-4">
      {strong.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="flex items-center gap-1.5 font-sans text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <AwardIcon size={14} />
            Kuchli mavzular
          </h3>

          <div className="mt-3 divide-y divide-hairline">
            {strong.map((entry) => (
              <div key={entry.module.id} className="py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-xs font-semibold text-foreground">
                    {entry.module.title}
                  </span>
                  <span className="font-sans text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {entry.mastery}%
                  </span>
                </div>
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="bar-fill h-full rounded-full bg-emerald-500"
                    style={{ width: `${entry.mastery}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {weak.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="flex items-center gap-1.5 font-sans text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <TrendingUpIcon size={14} />
            Rivojlantirish kerak
          </h3>

          <div className="mt-3 divide-y divide-hairline">
            {weak.map((entry) => (
              <div key={entry.module.id} className="py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-xs font-semibold text-foreground">
                    {entry.module.title}
                  </span>
                  <span className="font-sans text-xs font-bold text-amber-600 dark:text-amber-400">
                    {entry.mastery}%
                  </span>
                </div>
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="bar-fill h-full rounded-full bg-amber-500"
                    style={{ width: `${entry.mastery}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Metrics({
  child,
  overall,
  exams
}: {
  child: ChildRecord;
  overall: ReturnType<typeof curriculumProgress>;
  exams: ReturnType<typeof examStats>;
}) {
  const items = [
    { value: `${overall.done}`, unit: `/${overall.total}`, label: t.pgMetricTopics },
    { value: exams === null ? '—' : `${exams.average}`, unit: exams ? '%' : '', label: t.pgMetricExams },
    { value: `${child.homeworkRate}`, unit: '%', label: t.lessonHomework },
    { value: `${child.attendanceRate}`, unit: '%', label: t.lsAttRate }
  ];

  return (
    <div>
      <h3 className="mb-2 px-1 font-sans text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        Ko'rsatkichlar
      </h3>
      <div className="grid grid-cols-2 gap-2.5">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="font-sans text-xl font-bold tabular-nums text-foreground">
              {item.value}
              {item.unit && (
                <span className="ml-0.5 font-sans text-xs font-normal text-mutedfg">
                  {item.unit}
                </span>
              )}
            </p>
            <p className="mt-0.5 font-sans text-xs text-mutedfg">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Activity({
  child,
  watched,
  weeks
}: {
  child: ChildRecord;
  watched: ReturnType<typeof watchedVideos>;
  weeks: ReturnType<typeof weeklyActivity>;
}) {
  const hours = Math.floor(watched.seconds / 3600);
  const minutes = Math.round((watched.seconds % 3600) / 60);

  return (
    <div>
      <h3 className="mb-2 px-1 font-sans text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {t.pgActivityHeader}
      </h3>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="font-sans text-xl font-bold tabular-nums text-foreground">
            {child.lessonCount}
          </p>
          <p className="mt-0.5 font-sans text-xs text-mutedfg">{t.pgLessonsTaken}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="font-sans text-xl font-bold tabular-nums text-foreground">
            {watched.count}
          </p>
          <p className="mt-0.5 font-sans text-xs text-mutedfg">
            {t.pgVideosWatched} · {t.pgDuration(hours, minutes)}
          </p>
        </div>
      </div>
    </div>
  );
}

function Recent({ items }: { items: ActivityItem[] }) {
  const label = (item: ActivityItem) => {
    if (item.kind === 'exam') return t.pgActExam(item.detail ?? '');
    if (item.kind === 'homework') return t.pgActHomework;
    if (item.kind === 'missed') return t.pgActMissed;
    return t.pgActAttended;
  };
  const tone = (item: ActivityItem) =>
    item.kind === 'missed' ? 'hsl(var(--warn))' : 'hsl(var(--good))';

  return (
    <div>
      <h3 className="mb-2 px-1 font-sans text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {t.pgRecentHeader}
      </h3>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {items.map((item, i) => (
          <div
            key={`${item.kind}-${item.date}-${i}`}
            className={[
              'flex items-center gap-3 px-4 py-3',
              i === items.length - 1 ? '' : 'border-b border-hairline'
            ].join(' ')}
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: tone(item) }}
            />
            <span className="min-w-0 flex-1 truncate font-sans text-xs font-medium text-foreground">
              {label(item)}
            </span>
            <span className="shrink-0 font-sans text-xs tabular-nums text-mutedfg">
              {shortDate(item.date)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Levels({
  levels,
  openLevelId
}: {
  levels: CurriculumLevel[];
  openLevelId: number | null;
}) {
  const [open, setOpen] = useState<number[]>(openLevelId === null ? [] : [openLevelId]);

  return (
    <div>
      <h3 className="mb-2 px-1 font-sans text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {t.pgLevelsHeader}
      </h3>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {levels.map((level, i) => {
          const state = levelAccess(levels, level);
          const progress = levelProgress(level);
          const locked = state === 'locked';
          const expanded = open.includes(level.id);

          return (
            <div
              key={level.id}
              className={i === levels.length - 1 ? '' : 'border-b border-hairline'}
            >
              <button
                type="button"
                disabled={locked}
                onClick={() => {
                  haptic('light');
                  setOpen((prev) =>
                    prev.includes(level.id)
                      ? prev.filter((id) => id !== level.id)
                      : [...prev, level.id]
                  );
                }}
                className={[
                  'flex w-full items-center gap-3 px-4 py-3.5 text-left',
                  locked ? 'opacity-50' : 'transition-opacity duration-100 ease-out active:opacity-75'
                ].join(' ')}
              >
                <span className="w-8 shrink-0 font-display text-base font-bold text-foreground">
                  {level.code}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="block truncate font-sans text-sm font-semibold text-foreground">
                    {level.title}
                  </span>
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="bar-fill h-full rounded-full bg-blue-600"
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                </div>
                {locked ? (
                  <LockIcon size={14} className="shrink-0 text-mutedfg" />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-xs font-semibold tabular-nums text-blue-600 dark:text-blue-400">
                      {progress.percent}%
                    </span>
                    <ChevronDownIcon
                      size={16}
                      className="shrink-0 text-slate-400 transition-transform duration-200"
                      style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
                    />
                  </div>
                )}
              </button>

              {expanded && !locked && (
                <ul className="accordion-in border-t border-hairline bg-slate-50/60 px-4 py-1.5 dark:bg-slate-900/60">
                  {level.modules.map((module) => {
                    const moduleState = moduleAccess(levels, module);
                    const moduleProg = moduleProgress(module);

                    return (
                      <li
                        key={module.id}
                        className="flex items-center gap-3 border-b border-hairline py-2.5 last:border-b-0"
                      >
                        <span className="w-9 shrink-0 font-sans text-xs font-bold text-mutedfg">
                          {module.code}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-sans text-xs font-medium text-foreground">
                          {module.title}
                        </span>
                        {moduleState === 'locked' ? (
                          <LockIcon size={12} className="shrink-0 text-mutedfg" />
                        ) : moduleState === 'completed' ? (
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                            <CheckIcon size={10} strokeWidth={3.5} />
                          </span>
                        ) : (
                          <span className="font-sans text-xs font-semibold tabular-nums text-blue-600 dark:text-blue-400">
                            {moduleProg.done}/{moduleProg.total}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
